import { Request, Response } from 'express';
import pool from '../database/db';

/**
 * POST /api/esign/sign-contract
 *
 * Executes when a tenant clicks "Approve and Legally Sign Contract".
 *
 * Atomic transaction — all three steps succeed together or none is committed:
 *   1. Validates the document exists and belongs to the claiming signer.
 *   2. Inserts an immutable audit trail row into public.esign_audit_log.
 *   3. Updates public.esign_documents — sets status = 'fully_executed',
 *      records the server-side timestamp and captured IP address.
 *   4. Updates public.properties — sets status = 'rented'.
 *
 * Security notes:
 *   - Timestamp is generated server-side (NOW()) — never trusted from the client.
 *   - IP is captured from req.ip / X-Forwarded-For — never trusted from the body.
 *   - All queries are fully parameterized; no string interpolation touches DB.
 *   - signatureData (base64 canvas PNG or typed text) is stored as TEXT in the
 *     audit log for evidentiary purposes.
 *
 * Expected JSON body:
 *   documentId    string  — UUID / ID of the esign_documents row to execute
 *   tenantId      string  — ID of the signing tenant (from their session)
 *   tenantName    string  — Full legal name as typed/confirmed by the tenant
 *   tenantEmail   string  — Tenant email for audit record
 *   signatureData string  — Base64-encoded canvas PNG  OR  typed-name string
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
      error: 'Validation failed',
      message: 'Explicit consent (agreed: true) is required to execute this contract.',
    });
  }

  // ── Capture IP server-side — never from request body ─────────────────────
  // Handles both direct connections and reverse-proxy setups (nginx, etc.)
  const rawIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
    req.socket.remoteAddress ??
    req.ip ??
    'unknown';

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ── Step 1: Fetch and lock the document row ───────────────────────────
    const docResult = await client.query(
      `SELECT id, property_id, tenant_id, status
       FROM public.esign_documents
       WHERE id = $1
       FOR UPDATE`,
      [documentId.trim()]
    );

    if (docResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: 'Not found',
        message: `E-sign document ${documentId} does not exist.`,
      });
    }

    const doc = docResult.rows[0];

    // Guard: document must belong to the claiming tenant
    if (doc.tenant_id?.toString() !== tenantId.trim()) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to sign this document.',
      });
    }

    // Guard: prevent double-signing an already executed document
    if (doc.status === 'fully_executed') {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: 'Conflict',
        message: 'This contract has already been fully executed.',
      });
    }

    // ── Step 2: Insert immutable audit trail record ───────────────────────
    // This row must NEVER be updated — it is the legal evidence of the signing event.
    await client.query(
      `INSERT INTO public.esign_audit_log (
        document_id,
        tenant_id,
        tenant_name,
        tenant_email,
        signature_data,
        signer_ip,
        signed_at,
        user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)`,
      [
        documentId.trim(),
        tenantId.trim(),
        tenantName.trim(),
        tenantEmail.trim().toLowerCase(),
        signatureData.trim(),
        rawIp,
        req.headers['user-agent'] ?? 'unknown',
      ]
    );

    // ── Step 3: Mark the document as fully executed ───────────────────────
    // signed_at and signer_ip are written by the server — not from req.body
    const updatedDoc = await client.query(
      `UPDATE public.esign_documents
       SET
         status      = 'fully_executed',
         signed_at   = NOW(),
         signer_ip   = $1,
         signer_name = $2
       WHERE id = $3
       RETURNING
         id,
         property_id   AS "propertyId",
         tenant_id     AS "tenantId",
         status,
         signed_at     AS "signedAt",
         signer_ip     AS "signerIp",
         signer_name   AS "signerName"`,
      [rawIp, tenantName.trim(), documentId.trim()]
    );

    // ── Step 4: Flip the property status to 'rented' ─────────────────────
    await client.query(
      `UPDATE public.properties
       SET status = 'rented'
       WHERE id = $1`,
      [doc.property_id]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      message: 'Contract signed and legally executed. Property has been marked as rented.',
      executedDocument: updatedDoc.rows[0],
      auditRecord: {
        signerIp: rawIp,
        signedAt: new Date().toISOString(), // reflects server NOW()
        tenantName: tenantName.trim(),
        tenantEmail: tenantEmail.trim().toLowerCase(),
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[signContract] Transaction rolled back:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};
