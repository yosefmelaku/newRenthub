# Cloudinary Setup Guide for RentHub

## ✅ What Has Been Done

I've successfully implemented Cloudinary image upload integration for property images:

### Backend Changes:
1. ✅ Installed packages: `cloudinary`, `multer`, `@types/multer`
2. ✅ Created `backend/controllers/upload.controller.ts` with image upload handler
3. ✅ Added upload route: `POST /api/upload/property-image`
4. ✅ Configured Cloudinary with environment variables
5. ✅ Added automatic image optimization (1200x800, auto quality, auto format)
6. ✅ Images are uploaded to `renthub/properties` folder in Cloudinary

### Frontend Changes:
1. ✅ Updated `MyPropertiesPage.tsx` to upload images to Cloudinary before creating property
2. ✅ Removed base64 encoding - now uses direct file upload
3. ✅ Added "Uploading Image..." state indicator
4. ✅ Both Add and Edit modals now use Cloudinary

### What Changed:
- **Before**: Images were base64-encoded and stored directly in database (huge payload, slow, unreliable)
- **After**: Images are uploaded to Cloudinary CDN, only the URL is stored in database (fast, reliable, scalable)

---

## 🔧 What You Need to Do

### Step 1: Create Cloudinary Account (Free)

1. Go to https://cloudinary.com/users/register_free
2. Sign up for a free account (generous free tier)
3. Verify your email

### Step 2: Get Your Credentials

1. Log in to Cloudinary dashboard: https://cloudinary.com/console
2. You'll see your **Account Details** section with:
   - **Cloud Name** (e.g., `dxyz123abc`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123`)

### Step 3: Add Credentials to Backend .env

1. Open `backend/.env` file
2. Add these lines at the bottom (replace with YOUR actual values):

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME="your_cloud_name_here"
CLOUDINARY_API_KEY="your_api_key_here"
CLOUDINARY_API_SECRET="your_api_secret_here"
```

**Example (with fake values):**
```env
CLOUDINARY_CLOUD_NAME="renthub-demo"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="abcdefghijklmnopqrstuvwxyz123"
```

### Step 4: Restart Backend Server

```bash
cd backend
bun run index.ts
```

### Step 5: Test Upload

1. Log in as a property owner (Phone: `+251911111111`, Password: `test123`)
2. Click "Add New Property"
3. Upload an image
4. Fill in property details
5. Click "Save Property"
6. Watch for "Uploading Image..." then "Saving..." states
7. Property should save successfully with image from Cloudinary

---

## 📸 How It Works Now

### Upload Flow:
1. User selects image file in frontend
2. Frontend shows preview from local file
3. User clicks "Save Property"
4. **Step 1**: Image file is uploaded to Cloudinary API
5. Cloudinary returns secure URL (e.g., `https://res.cloudinary.com/renthub-demo/image/upload/v1234567890/renthub/properties/abc123.jpg`)
6. **Step 2**: Property is created in database with Cloudinary URL
7. Frontend displays image from Cloudinary CDN

### Benefits:
- ✅ Fast image loading from CDN
- ✅ Automatic image optimization
- ✅ Automatic format conversion (WebP for modern browsers)
- ✅ Reliable uploads (no more 400 errors)
- ✅ Scalable (no database bloat)
- ✅ Professional image management

---

## 🔍 Troubleshooting

### Error: "Failed to upload image"
**Solution**: Check that Cloudinary credentials are correct in `backend/.env`

### Error: "Missing or invalid authentication header"
**Solution**: 
1. Logout and login again to get fresh JWT token
2. Clear browser localStorage
3. Check browser console for token

### Images not displaying
**Solution**: Check browser console - Cloudinary URL should start with `https://res.cloudinary.com/`

### Upload takes too long
**Solution**: Check image file size - should be under 5MB

---

## 📋 Test Checklist

- [ ] Backend server running with Cloudinary credentials
- [ ] Login as property owner
- [ ] Open "Add New Property" modal
- [ ] Upload image (JPG/PNG under 5MB)
- [ ] See preview
- [ ] Fill property details
- [ ] Click "Save Property"
- [ ] See "Uploading Image..." state
- [ ] See "Saving..." state
- [ ] Property created successfully
- [ ] Image displays in property list
- [ ] Image URL starts with `https://res.cloudinary.com/`

---

## 🎉 Expected Result

After setup, you should be able to:
1. Upload property images without errors
2. See images load quickly from Cloudinary CDN
3. Images are automatically optimized for web
4. Database only stores small URL strings (not huge base64 blobs)
5. Tenants and admins can see property images properly

---

## 📝 Notes

- Free Cloudinary tier: 25 GB storage, 25 GB monthly bandwidth (plenty for testing)
- Images are optimized to max 1200x800 pixels
- Auto quality and format conversion enabled
- All images stored in `renthub/properties/` folder in your Cloudinary account
- You can manage/delete images from Cloudinary dashboard

---

## 🚀 Next Steps After Setup

Once Cloudinary is working:
1. Test creating multiple properties with images
2. Test editing property images
3. Verify images display on tenant marketplace
4. Verify images display on admin dashboard
5. Check Cloudinary dashboard to see uploaded images

---

## 🔗 Helpful Links

- Cloudinary Dashboard: https://cloudinary.com/console
- Cloudinary Media Library: https://cloudinary.com/console/media_library
- Cloudinary Docs: https://cloudinary.com/documentation
- Image Upload Settings: Can be modified in `backend/controllers/upload.controller.ts`
