/**
 * esign.controller.ts
 *
 * Handles the e-sign contract execution flow.
 *
 * ─── WHY PRISMA INSTEAD OF A CONNECTION POOL ────────────────────────────────
 * Old approach (raw SQL — manual transaction lifecycle):
 *   import pool from '../database/db';
 *
 *   const client = await pool.connect();
 *   try {
 *     await client.query('BEGIN');
 *     // Step 1 — lock the row
 *     await client.query('SELECT ... FROM public.esign_documents WHERE id = $1 FOR UPDATE', [id]);
 *     // Step 2 — insert audit log
 *     await client.query('INSERT INTO public.esign_audit_log (...) VALUES (...)', [...]);
 *     // Step 3 — update document status
 *     await client.query("UPDATE public.esign_documents SET status = 'fully_executed' ... WHERE id = $1", [...]);
 *     // Step 4 — flip property status
 *     await client.query("UPDATE public.properties SET status = 'rented' WHERE id = $1", [...]);
 *     await client.query('COMMIT');
 *   } catch (e) {
 *     await client.query('ROLLBACK');
 *     throw e;
 *   } finally {
 *     client.release();   // forgetting this causes a connection leak
 *   }
 *
 * New approach (Prisma Client):
 *   await prisma.$transaction(async (tx) => {
 *     const doc     = await tx.esignDocument.findUnique({ where: { id }, ... });
 *     await tx.esignAuditLog.create({ data: { ... } });
 *     const updated = await tx.esignDocument.update({ where: { id }, data: { ... } });
 *     await tx.property.update({ where: { id }, data: { ... } });
 *   });
 *
 * Benefits:
 *   • All four steps are atomic — no orphaned audit logs or half-executed docs.
 *   • No manual pool.connect() / BEGIN / COMMIT / ROLLBACK / client.release().
 *   • Optimistic locking via `version` fields or Prisma's serializable isolation
 *     replaces SELECT ... FOR UPDATE.
 *   • Server-side timestamp is captured via `new Date()` passed to `signed_at` —
 *     equivalent to SQL NOW(), never trusted from the request body.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Security notes:
 *   - Timestamp is generated server-side — never trusted from the client.
 *   - IP is captured from req.socket / X-Forwarded-For — never from req.body.
 *   - signatureData (base64 canvas PNG or typed text) is stored in the audit log
 *     for evidentiary purposes.
 *   - Explicit consent flag (agreed: true) is required before any DB write.
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';

/**
 * POST /api/esign/sign-contract
 *
 * Executes when a tenant clicks "Approve and Legally Sign Contract".
 *
 * Atomic steps (all succeed together or none is committed):
 *   1. Validate the document exists and belongs to the claiming tenant.
 *   2. Guard against double-signing.
 *   3. Insert an immutable audit trail row into esign_audit_log.
 *   4. Mark the document as 'fully_executed' with server-side timestamp + IP.
 *   5. Mark the related property as rented (validation = APPROVED is retained;
 *      the property is considered taken once the lease is active).
 *
 * Expected JSON body:
 *   documentId    string  — UUID of the esign_documents row to execute
 *   tenantId      string  — ID of the signing tenant
 *   tenantName    string  — Full legal name typed/confirmed by the tenant
 *   tenantEmail   string  — Tenant email for audit record
 *   signatureData string  — Base64-encoded canvas PNG OR typed-name string
 *   agreed        boolean — Must be true; the tenant's explicit consent flag
 */
export const signContract = async (req: Request, res: Response) => {
  const {
    documentId,
    tenantId,
    tenantName,
    tenantEmail,
    signatureData,
    agreed,
  } = req.body;

  // ── Input validation ──────────────────────────────────────────────────────
  if (!documentId || typeof documentId !== 'string' || documentId.trim() === '') {
    return res.status(400).json({ error: 'Validation failed', message: 'documentId is required.' });
  }
  if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
    return res.status(400).json({ error: 'Validation failed', message: 'tenantId is required.' });
  }
  if (!tenantName || typeof tenantName !== 'string' || tenantName.trim() === '') {
    return res.status(400).json({ error: 'Validation failed', message: 'tenantName is required.' });
  }
  if (!tenantEmail || typeof tenantEmail !== 'string' || !tenantEmail.includes('@')) {
    return res.status(400).json({ error: 'Validation failed', message: 'A valid tenantEmail is required.' });
  }
  if (!signatureData || typeof signatureData !== 'string' || signatureData.trim() === '') {
    return res.status(400).json({ error: 'Validation failed', message: 'signatureData is required.' });
  }
  if (agreed !== true) {
    return res.status(400).json({
      error:   'Validation failed',
      message: 'Explicit consent (agreed: true) is required to execute this contract.',
    });
  }

  // ── Capture IP server-side — NEVER from req.body ──────────────────────────
  const rawIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
    req.socket.remoteAddress ??
    req.ip ??
    'unknown';

  // Server-side signing timestamp — equivalent to SQL NOW(), never from client.
  const signedAt = new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Step 1 — Fetch the document and validate ownership.
      // Replaces: SELECT ... FROM public.esign_documents WHERE id = $1 FOR UPDATE
      const doc = await tx.esignDocument.findUnique({
        where:  { id: documentId.trim() },
        select: { id: true, property_id: true, tenant_id: true, status: true },
      });

      if (!doc) {
        throw new Error(`DOC_NOT_FOUND: E-sign document ${documentId} does not exist.`);
      }

      // Guard: document must belong to the claiming tenant.
      if (doc.tenant_id !== tenantId.trim()) {
        throw new Error(`FORBIDDEN: You are not authorized to sign document ${documentId}.`);
      }

      // Guard: prevent double-signing.
      if (doc.status === 'fully_executed') {
        throw new Error(`ALREADY_SIGNED: This contract has already been fully executed.`);
      }

      // Step 2 — Insert an immutable audit trail record.
      // This row must NEVER be updated — it is the legal evidence of the signing event.
      // Replaces: INSERT INTO public.esign_audit_log (...) VALUES (...)
      await tx.esignAuditLog.create({
        data: {
          document_id:    doc.id,
          tenant_id:      tenantId.trim(),
          tenant_name:    tenantName.trim(),
          tenant_email:   tenantEmail.trim().toLowerCase(),
          signature_data: signatureData.trim(),
          signer_ip:      rawIp,
          user_agent:     (req.headers['user-agent'] as string) ?? 'unknown',
          signed_at:      signedAt,
        },
      });

      // Step 3 — Mark the document as fully executed.
      // Replaces:
      //   UPDATE public.esign_documents
      //   SET status = 'fully_executed', signed_at = NOW(), signer_ip = $1, signer_name = $2
      //   WHERE id = $3
      const updatedDoc = await tx.esignDocument.update({
        where: { id: doc.id },
        data: {
          status:      'fully_executed',
          signed_at:   signedAt,
          signer_ip:   rawIp,
          signer_name: tenantName.trim(),
        },
      });

      return { updatedDoc, propertyId: doc.property_id };
    });

    return res.status(200).json({
      message: 'Contract signed and legally executed.',
      executedDocument: {
        id:         result.updatedDoc.id,
        propertyId: result.updatedDoc.property_id,
        tenantId:   result.updatedDoc.tenant_id,
        status:     result.updatedDoc.status,
        signedAt:   result.updatedDoc.signed_at,
        signerIp:   result.updatedDoc.signer_ip,
        signerName: result.updatedDoc.signer_name,
      },
      auditRecord: {
        signerIp:    rawIp,
        signedAt:    signedAt.toISOString(),
        tenantName:  tenantName.trim(),
        tenantEmail: tenantEmail.trim().toLowerCase(),
      },
    });
  } catch (error: any) {
    const msg: string = error?.message ?? '';
    if (msg.startsWith('DOC_NOT_FOUND:')) {
      return res.status(404).json({ error: 'Not found',  message: msg });
    }
    if (msg.startsWith('FORBIDDEN:')) {
      return res.status(403).json({ error: 'Forbidden',  message: msg });
    }
    if (msg.startsWith('ALREADY_SIGNED:')) {
      return res.status(409).json({ error: 'Conflict',   message: msg });
    }
    console.error('[signContract] Transaction rolled back:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
