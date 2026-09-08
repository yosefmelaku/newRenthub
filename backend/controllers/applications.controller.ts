/**
 * applications.controller.ts
 * 
 * Handles rental applications from tenants
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';

/**
 * POST /api/applications/submit
 * Submit a new rental application
 */
export const submitApplication = async (req: Request, res: Response) => {
  try {
    const {
      propertyId,
      propertyTitle,
      propertyLocation,
      monthlyRent,
      ownerId,
      applicantData,
      applicantEmail,
      applicantName,
      status = 'pending',
      submittedAt,
    } = req.body;

    // Get authenticated user ID from middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User must be authenticated to submit application',
      });
    }

    // Validate required fields
    if (!propertyId || !applicantEmail || !ownerId || !applicantData) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Property ID, applicant email, owner ID, and applicant data are required',
      });
    }

    // Check if user already applied for this property
    const existingApplication = await prisma.rentalApplication.findFirst({
      where: {
        property_id: propertyId,
        applicant_email: applicantEmail,
        status: { in: ['pending', 'approved'] },
      },
    });

    if (existingApplication) {
      return res.status(409).json({
        error: 'Already applied',
        message: 'You have already applied for this property',
      });
    }

    // Parse move-in date
    let moveInDate: Date;
    try {
      moveInDate = new Date(applicantData.moveInDate);
      if (isNaN(moveInDate.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (e) {
      return res.status(400).json({
        error: 'Invalid move-in date',
        message: 'Please provide a valid move-in date',
      });
    }

    // Create the application with all individual fields from schema
    const application = await prisma.rentalApplication.create({
      data: {
        property_id: propertyId,
        property_title: propertyTitle || 'Unknown Property',
        property_location: propertyLocation || '',
        monthly_rent: monthlyRent || 0,
        owner_id: ownerId,
        applicant_id: userId,
        applicant_name: applicantName || 'Unknown',
        applicant_email: applicantEmail,
        // Map all form fields to schema columns
        full_name: applicantData.fullName || '',
        email: applicantData.email || applicantEmail,
        phone: applicantData.phone || '',
        occupation: applicantData.occupation || '',
        employer: applicantData.employer || null,
        monthly_income: applicantData.monthlyIncome || '',
        number_of_occupants: applicantData.numberOfOccupants || '1',
        move_in_date: moveInDate,
        previous_address: applicantData.previousAddress || null,
        reason_for_moving: applicantData.reasonForMoving || null,
        has_pets: applicantData.hasPets || 'no',
        pet_details: applicantData.petDetails || null,
        emergency_contact_name: applicantData.emergencyContactName || '',
        emergency_contact_phone: applicantData.emergencyContactPhone || '',
        additional_notes: applicantData.additionalNotes || null,
        status: status,
        submitted_at: submittedAt ? new Date(submittedAt) : new Date(),
      },
    });

    // TODO: Send notification to owner (email/SMS)
    // TODO: Send confirmation email to applicant

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application: {
        id: application.id,
        propertyTitle: application.property_title,
        status: application.status,
        submittedAt: application.submitted_at,
      },
    });
  } catch (error: any) {
    console.error('[submitApplication] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to submit application',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

/**
 * GET /api/applications/owner/:ownerId
 * Get all applications for properties owned by this owner
 */
export const getOwnerApplications = async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.params;

    const applications = await prisma.rentalApplication.findMany({
      where: { owner_id: ownerId },
      orderBy: { submitted_at: 'desc' },
    });

    return res.status(200).json({
      count: applications.length,
      applications,
    });
  } catch (error: any) {
    console.error('[getOwnerApplications] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch applications',
    });
  }
};

/**
 * GET /api/applications/tenant/:tenantEmail
 * Get all applications submitted by this tenant
 */
export const getTenantApplications = async (req: Request, res: Response) => {
  try {
    const { tenantEmail } = req.params;

    // Decode the email param in case it's URL encoded
    const decodedEmail = decodeURIComponent(tenantEmail);

    const applications = await prisma.rentalApplication.findMany({
      where: { applicant_email: decodedEmail },
      orderBy: { submitted_at: 'desc' },
    });

    return res.status(200).json({
      count: applications.length,
      applications,
    });
  } catch (error: any) {
    console.error('[getTenantApplications] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch applications',
    });
  }
};

/**
 * PATCH /api/applications/:id/status
 * Update application status (approve/reject)
 */
export const updateApplicationStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Status must be: approved, rejected, or pending',
      });
    }

    const application = await prisma.rentalApplication.update({
      where: { id },
      data: {
        status,
        reviewed_at: new Date(),
        notes: notes || null,
      },
    });

    // TODO: Send notification to applicant

    return res.status(200).json({
      success: true,
      message: `Application ${status}`,
      application,
    });
  } catch (error: any) {
    console.error('[updateApplicationStatus] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update application status',
    });
  }
};
