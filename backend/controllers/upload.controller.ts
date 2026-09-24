/**
 * upload.controller.ts
 *
 * Handles image uploads to Cloudinary for property images.
 */

import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

const cloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage (we'll upload directly to Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

/**
 * Upload property image to Cloudinary
 * POST /api/upload/property-image
 */
export const uploadPropertyImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Keep local development usable when Cloudinary credentials are not set.
    // Production still requires Cloudinary so images are not stored in the database.
    if (!cloudinaryConfigured) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({
          error: 'Image upload is not configured',
          message: 'Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to backend/.env, then restart the backend.',
        });
      }

      const imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      console.warn('⚠️ [uploadPropertyImage] Cloudinary is not configured; using a local development image data URL.');
      return res.status(200).json({
        success: true,
        imageUrl,
        message: 'Image saved using local development storage.',
      });
    }

    console.log('📸 [uploadPropertyImage] Received file:', req.file.originalname);
    console.log('📸 [uploadPropertyImage] File size:', req.file.size, 'bytes');

    // Upload to Cloudinary using upload_stream
    const uploadPromise = new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'renthub/properties',
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 800, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('❌ [uploadPropertyImage] Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('✅ [uploadPropertyImage] Cloudinary upload success:', result?.secure_url);
            resolve(result!.secure_url);
          }
        }
      );

      uploadStream.end(req.file!.buffer);
    });

    const imageUrl = await uploadPromise;

    return res.status(200).json({
      success: true,
      imageUrl,
      message: 'Image uploaded successfully',
    });

  } catch (err: any) {
    console.error('❌ [uploadPropertyImage] Error:', err);
    return res.status(500).json({
      error: 'Failed to upload image',
      message: err.message || 'An unexpected error occurred',
    });
  }
};

// Export multer middleware for route use
export const uploadMiddleware = upload.single('image');
