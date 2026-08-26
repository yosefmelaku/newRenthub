/**
 * admin.controller.ts
 * All endpoints are protected by loadUserFromHeader + requireSuperadmin middleware.
 * Role is read from req.user (set by the middleware after DB lookup) — never from
 * the request body or query string.
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/stats
// Platform-wide dashboard statistics.
// ─────────────────────────────────────────────────────────────────────────────
export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalTenants,
      totalOwners,
      totalProperties,
      pendingProperties,
      approvedProperties,
      activeLeases,
      totalTickets,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'TENANT' } }),
      prisma.user.count({ where: { role: 'OWNER'  } }),
      prisma.property.count(),
      prisma.property.count({ where: { validation: 'PENDING'  } }),
      prisma.property.count({ where: { validation: 'APPROVED' } }),
      prisma.lease.count({   where: { status: 'ACTIVE' } }),
      prisma.maintenanceTicket.count(),
    ]);

    return res.status(200).json({
      totalUsers,
      totalTenants,
      totalOwners,
      totalProperties,
      pendingProperties,
      approvedProperties,
      activeLeases,
      totalTickets,
    });
  } catch (err) {
    console.error('[getDashboardStats]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/users
// Classified user directory. Optional ?role=TENANT|OWNER|SUPERADMIN filter.
// Optional ?search=<term> for name/email/phone search.
// ─────────────────────────────────────────────────────────────────────────────
export const getClassifiedUsers = async (req: Request, res: Response) => {
  try {
    const { role, search } = req.query;

    const where: any = {};
    if (role) where.role = role as string;
    if (search) {
      const term = String(search).trim();
      where.OR = [
        { full_name: { contains: term, mode: 'insensitive' } },
        { email:     { contains: term, mode: 'insensitive' } },
        { phone:     { contains: term, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id:         true,
        full_name:  true,
        email:      true,
        phone:      true,
        role:       true,
        is_active:  true,
        created_at: true,
        properties: { select: { id: true } },
        leases:     { select: { id: true }, where: { status: 'ACTIVE' } },
      },
      orderBy: [{ role: 'desc' }, { full_name: 'asc' }],
    });

    const enriched = users.map((u) => ({
      id:            u.id,
      name:          u.full_name,
      email:         u.email,
      phone:         u.phone,
      role:          u.role,
      is_active:     u.is_active,
      created_at:    u.created_at,
      total_uploads: u.properties.length,
      active_leases: u.leases.length,
    }));

    return res.status(200).json({ count: enriched.length, users: enriched });
  } catch (err) {
    console.error('[getClassifiedUsers]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/users/:id/activate
// PATCH /api/admin/users/:id/deactivate
// ─────────────────────────────────────────────────────────────────────────────
export const setUserActiveStatus = async (req: Request, res: Response) => {
  const { id }    = req.params;
  const activate  = req.path.endsWith('/activate');

  try {
    const user = await prisma.user.update({
      where: { id },
      data:  { is_active: activate },
      select: { id: true, full_name: true, email: true, role: true, is_active: true },
    });

    return res.status(200).json({
      message: `Account ${activate ? 'activated' : 'deactivated'} successfully.`,
      user,
    });
  } catch (err: any) {
    if (err?.code === 'P2025') return res.status(404).json({ error: 'User not found.' });
    console.error('[setUserActiveStatus]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/approvals
// All PENDING properties waiting for superadmin approval.
// ─────────────────────────────────────────────────────────────────────────────
export const getPendingApprovals = async (_req: Request, res: Response) => {
  try {
    const pendingProperties = await prisma.property.findMany({
      where:   { validation: 'PENDING' },
      include: { owner: { select: { id: true, full_name: true, email: true } } },
      orderBy: { created_at: 'asc' },
    });

    return res.status(200).json({
      count: pendingProperties.length,
      pendingProperties: pendingProperties.map((p) => ({
        propertyId:  p.id,
        title:       p.title,
        description: p.description,
        address:     p.address,
        city:        p.city,
        rent_amount: p.rent_amount,
        category:    p.category,
        bedrooms:    p.bedrooms,
        bathrooms:   p.bathrooms,
        image_url:   p.image_url,
        status:      p.validation,
        submittedAt: p.created_at,
        ownerId:     p.owner.id,
        ownerName:   p.owner.full_name,
        ownerEmail:  p.owner.email,
      })),
    });
  } catch (err) {
    console.error('[getPendingApprovals]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/properties/:id/approve
// PATCH /api/admin/properties/:id/reject
// ─────────────────────────────────────────────────────────────────────────────
export const setPropertyValidation = async (req: Request, res: Response) => {
  const { id }  = req.params;
  const approve = req.path.endsWith('/approve');

  try {
    const property = await prisma.property.update({
      where: { id },
      data:  { validation: approve ? 'APPROVED' : 'REJECTED' },
      select: { id: true, title: true, validation: true },
    });

    return res.status(200).json({
      message:  `Property ${approve ? 'approved' : 'rejected'}.`,
      property,
    });
  } catch (err: any) {
    if (err?.code === 'P2025') return res.status(404).json({ error: 'Property not found.' });
    console.error('[setPropertyValidation]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/properties
// All properties with owner info, optional ?status=PENDING|APPROVED|REJECTED
// ─────────────────────────────────────────────────────────────────────────────
export const getAllProperties = async (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;

    const where: any = {};
    if (status) where.validation = String(status).toUpperCase();
    if (search) {
      const term = String(search).trim();
      where.OR = [
        { title:   { contains: term, mode: 'insensitive' } },
        { address: { contains: term, mode: 'insensitive' } },
        { city:    { contains: term, mode: 'insensitive' } },
      ];
    }

    const properties = await prisma.property.findMany({
      where,
      include: {
        owner: { select: { id: true, full_name: true, email: true } },
        leases: { where: { status: 'ACTIVE' }, select: { id: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.status(200).json({
      count: properties.length,
      properties: properties.map((p) => ({
        id:           p.id,
        title:        p.title,
        category:     p.category,
        address:      p.address,
        city:         p.city,
        rent_amount:  p.rent_amount,
        validation:   p.validation,
        bedrooms:     p.bedrooms,
        bathrooms:    p.bathrooms,
        image_url:    p.image_url,
        created_at:   p.created_at,
        active_leases: p.leases.length,
        ownerId:      p.owner.id,
        ownerName:    p.owner.full_name,
        ownerEmail:   p.owner.email,
      })),
    });
  } catch (err) {
    console.error('[getAllProperties]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/rentals-matrix
// All ACTIVE leases with tenant + property + owner detail.
// ─────────────────────────────────────────────────────────────────────────────
export const getRentalsMatrix = async (_req: Request, res: Response) => {
  try {
    const activeLeases = await prisma.lease.findMany({
      where: { status: 'ACTIVE' },
      include: {
        tenant: { select: { id: true, full_name: true, email: true } },
        property: {
          select: {
            id: true, title: true, address: true, city: true,
            category: true, bedrooms: true, bathrooms: true,
            rent_amount: true, validation: true,
            owner: { select: { id: true, full_name: true, email: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.status(200).json({
      count: activeLeases.length,
      rentalsMatrix: activeLeases.map((l) => ({
        leaseId:             l.id,
        leaseStartDate:      l.start_date,
        leaseEndDate:        l.end_date,
        monthlyRent:         l.monthly_rent,
        leaseStatus:         l.status,
        tenantId:            l.tenant?.id,
        tenantName:          l.tenant?.full_name,
        tenantEmail:         l.tenant?.email,
        propertyId:          l.property.id,
        propertyTitle:       l.property.title,
        propertyLocation:    `${l.property.address}, ${l.property.city}`,
        propertyType:        l.property.category,
        propertyListedPrice: l.property.rent_amount,
        ownerId:             l.property.owner.id,
        ownerName:           l.property.owner.full_name,
        ownerEmail:          l.property.owner.email,
      })),
    });
  } catch (err) {
    console.error('[getRentalsMatrix]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
