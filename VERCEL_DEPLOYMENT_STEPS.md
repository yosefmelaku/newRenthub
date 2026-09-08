# 🚀 Vercel Deployment - Step by Step Checklist

## ⚠️ Important: Complete Local Setup First!

Before deploying, run these 3 commands to finish setup:

```bash
cd backend
bun run seed-test-accounts.ts
bun run run-migration-rental-applications.ts
bun run index.ts  # Test that it works
```

Test everything works locally first! ✅

---

## 📝 Complete Deployment Procedure

### Phase 1: Prepare Your Code (10 minutes)

#### ✅ Step 1: Initialize Git
```bash
cd "C:\Users\HM Computer\Desktop\newRenthub"
git init
git add .
git commit -m "Initial commit - RentHub ready for deployment"
```

#### ✅ Step 2: Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `renthub`
3. Set to **Private**
4. **Don't** check "Initialize with README"
5. Click "Create repository"

#### ✅ Step 3: Push Code to GitHub
Copy the commands GitHub shows you:
```bash
git remote add origin https://github.com/YOUR_USERNAME/renthub.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

### Phase 2: Setup Cloud Database (15 minutes)

#### ✅ Step 4: Create Neon.tech Account
1. Go to https://neon.tech
2. Click "Sign Up" (use GitHub account for easy login)
3. Verify email if needed

#### ✅ Step 5: Create Database Project
1. Click "Create Project"
2. Project name: `renthub-db`
3. Region: Choose closest to your location
4. Click "Create Project"

#### ✅ Step 6: Get Connection String
After project created, you'll see:
```
postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
```

**COPY THIS** - You need it for Step 9!

#### ✅ Step 7: Run Database Migrations on Neon
```bash
# Set Neon database URL temporarily
$env:DATABASE_URL="postgresql://username:password@ep-xxx.neon.tech/neondb?sslmode=require"

# Run migrations
cd backend
bunx prisma db push

# Seed test accounts
bun run seed-test-accounts.ts
```

Replace the URL with YOUR Neon connection string!

---

### Phase 3: Deploy to Vercel (10 minutes)

#### ✅ Step 8: Create Vercel Account
1. Go to https://vercel.com/signup
2. Click "Continue with GitHub"
3. Authorize Vercel to access your GitHub

#### ✅ Step 9: Import Project
1. Click "Add New..." → "Project"
2. Find your `renthub` repository
3. Click "Import"

#### ✅ Step 10: Configure Build Settings

**Framework Preset**: Vite

**Root Directory**: `frontend`

**Build Command**: 
```bash
npm install && npm run build
```

**Output Directory**: `dist`

**Install Command**:
```bash
npm install
```

#### ✅ Step 11: Add Environment Variables

Click "Environment Variables" and add:

```bash
# Database
DATABASE_URL=postgresql://username:password@ep-xxx.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://username:password@ep-xxx.neon.tech/neondb?sslmode=require

# API
NODE_ENV=production
PORT=3000

# JWT (generate a random secret)
JWT_SECRET=your-super-secret-jwt-key-change-this-12345
```

**Generate JWT_SECRET**: Run this in PowerShell:
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

#### ✅ Step 12: Deploy!
1. Click "Deploy"
2. Wait 2-5 minutes for build to complete
3. You'll get a URL like: `https://renthub-xxxx.vercel.app`

---

### Phase 4: Setup Backend API (15 minutes)

#### ✅ Step 13: Create API Routes

You need to create Vercel serverless functions for your backend.

Create file: `frontend/api/index.js`

```javascript
// This will proxy all API requests to your backend
export default function handler(req, res) {
  // For now, return a simple response
  res.status(200).json({ message: 'API is working!' });
}
```

But wait! Your backend is in a separate folder. We need a different approach...

#### ✅ Step 14: Deploy Backend Separately (Better Approach)

**Option A: Deploy Backend as Separate Vercel Project**

1. In Vercel dashboard, click "Add New" → "Project"
2. Import the SAME repository again
3. This time:
   - **Root Directory**: `backend`
   - **Build Command**: Leave empty
   - **Output Directory**: `.`
   - Add same environment variables

**Option B: Use Vercel API Routes (Recommended)**

Create `vercel.json` in root folder:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "backend/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/dist/$1"
    }
  ]
}
```

#### ✅ Step 15: Update Frontend API URL

Edit `frontend/src/lib/api.ts` (or wherever you have API calls):

Change:
```typescript
const API_URL = 'http://localhost:3000/api';
```

To:
```typescript
const API_URL = import.meta.env.PROD 
  ? '/api'  // Production: same domain
  : 'http://localhost:3000/api';  // Development: local backend
```

#### ✅ Step 16: Push Changes
```bash
git add .
git commit -m "Add Vercel configuration"
git push
```

Vercel will auto-deploy the changes!

---

### Phase 5: Test Deployment (5 minutes)

#### ✅ Step 17: Test Your Deployed App

1. Open your Vercel URL: `https://renthub-xxxx.vercel.app`
2. Try to login with test account: `+251905728376` / `admin@321`
3. Browse rentals
4. Test application submission

#### ✅ Step 18: Check Logs

If something doesn't work:
1. Go to Vercel Dashboard
2. Click your project
3. Click "Deployments" → Latest deployment
4. Click "Functions" → View logs
5. Look for errors

---

## 🎯 Quick Checklist

Print this and check off as you go:

- [ ] ✅ Local setup complete (3 commands run)
- [ ] ✅ Git initialized and committed
- [ ] ✅ GitHub repository created
- [ ] ✅ Code pushed to GitHub
- [ ] ✅ Neon.tech account created
- [ ] ✅ Database project created
- [ ] ✅ Database URL copied
- [ ] ✅ Migrations run on Neon
- [ ] ✅ Test accounts seeded on Neon
- [ ] ✅ Vercel account created
- [ ] ✅ Project imported to Vercel
- [ ] ✅ Environment variables added
- [ ] ✅ vercel.json created
- [ ] ✅ API URL updated in frontend
- [ ] ✅ Changes pushed to GitHub
- [ ] ✅ Deployment successful
- [ ] ✅ Tested login on live site
- [ ] ✅ Tested application submission

---

## 🔧 Troubleshooting

### Issue: "Module not found" errors
**Fix**: Make sure `vercel.json` is in root folder and paths are correct

### Issue: "Database connection failed"
**Fix**: 
1. Check DATABASE_URL in Vercel environment variables
2. Make sure `?sslmode=require` is at the end
3. Run `bunx prisma db push` with Neon URL

### Issue: API requests fail (404)
**Fix**: 
1. Check `vercel.json` routes
2. Make sure backend/index.ts exports correct handler
3. Check Vercel function logs

### Issue: "JWT token invalid"
**Fix**: 
1. Make sure JWT_SECRET is set in Vercel
2. Same JWT_SECRET must be used for all environments
3. Try logging in again to get new token

---

## 💰 Costs

- **Neon.tech Free Tier**: 
  - ✅ 0.5 GB storage (enough for testing)
  - ✅ 3 GB data transfer/month
  - ✅ 1 project
  - 💰 Upgrade to Pro: $19/month for more

- **Vercel Free Tier**:
  - ✅ 100 GB bandwidth/month
  - ✅ Unlimited deployments
  - ✅ Custom domains
  - 💰 Upgrade to Pro: $20/month for teams

**Total Free Tier**: $0/month! ✅

---

## 📞 Need Help?

If you get stuck:

1. **Check Vercel Docs**: https://vercel.com/docs
2. **Check Neon Docs**: https://neon.tech/docs
3. **Check Prisma Docs**: https://www.prisma.io/docs

Common issues and solutions are in the full guide: `DEPLOYMENT_GUIDE.md`

---

## 🎉 Success!

When everything works, you'll have:
- ✅ Live URL: `https://renthub-xxxx.vercel.app`
- ✅ Cloud database running 24/7
- ✅ Auto-deploys on every git push
- ✅ Free hosting!

Share your URL with others to test! 🚀

---

## ⚡ Quick Deploy Commands (Summary)

```bash
# 1. Initial setup
cd backend
bun run seed-test-accounts.ts
bun run run-migration-rental-applications.ts

# 2. Git setup
cd ..
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/renthub.git
git push -u origin main

# 3. Database migration (with Neon URL)
cd backend
$env:DATABASE_URL="YOUR_NEON_URL"
bunx prisma db push
bun run seed-test-accounts.ts

# 4. After Vercel setup, update code
git add .
git commit -m "Add Vercel config"
git push
```

Done! 🎊
