# RentHub Deployment Guide - Vercel + Cloud Database

## 🎯 Overview

Your RentHub app has:
- **Frontend**: React + Vite (TypeScript)
- **Backend**: Node.js/Bun API
- **Database**: PostgreSQL (currently local)

We'll deploy:
- Frontend → **Vercel**
- Backend → **Vercel Serverless Functions**
- Database → **Neon.tech** (Free PostgreSQL cloud database)

---

## 📋 Prerequisites

Before starting, you need:
1. ✅ GitHub account
2. ✅ Vercel account (sign up at https://vercel.com)
3. ✅ Neon.tech account (sign up at https://neon.tech)
4. ✅ Git installed on your computer

---

## Part 1: Prepare Your Code

### Step 1: Initialize Git Repository

Open terminal in your project folder:

```bash
cd "C:\Users\HM Computer\Desktop\newRenthub"
git init
```

### Step 2: Create `.gitignore` File

Create or update `.gitignore` in the root folder:

```
# Dependencies
node_modules/
*/node_modules/
bun.lock
*/bun.lock
package-lock.json
*/package-lock.json

# Environment variables
.env
.env.local
.env.production
backend/.env
frontend/.env

# Build outputs
dist/
build/
.vercel/
.turbo/

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Database
*.db
*.sqlite

# Prisma
backend/prisma/migrations/**/migration.sql
!backend/prisma/migrations/**/
```

### Step 3: Commit Your Code

```bash
git add .
git commit -m "Initial commit - RentHub application"
```

---

## Part 2: Setup Cloud Database (Neon.tech)

### Step 1: Create Neon Account

1. Go to https://neon.tech
2. Click "Sign Up" (use GitHub for easy login)
3. Verify your email

### Step 2: Create New Database

1. Click "Create Project"
2. Give it a name: **renthub-db**
3. Select region: **Choose closest to your users** (e.g., US East, EU West)
4. Click "Create Project"

### Step 3: Get Database Connection String

After project is created:
1. You'll see a connection string like:
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
2. **Copy this entire string** - you'll need it!

### Step 4: Update Prisma Schema for Production

Edit `backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Add this line for Neon
}

generator client {
  provider = "prisma-client-js"
}

// ... rest of your schema stays the same
```

---

## Part 3: Setup GitHub Repository

### Step 1: Create GitHub Repo

1. Go to https://github.com
2. Click "+" → "New repository"
3. Name it: **renthub**
4. Choose **Private** (recommended)
5. **Don't** initialize with README (you already have code)
6. Click "Create repository"

### Step 2: Push Code to GitHub

Copy the commands from GitHub (or use these):

```bash
git remote add origin https://github.com/YOUR_USERNAME/renthub.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

## Part 4: Prepare Backend for Vercel

### Step 1: Create `vercel.json` in Root Folder

Create `vercel.json`:

```json
{
  "version": 2,
  "builds": [
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
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Step 2: Update Backend Package.json

Edit `backend/package.json` - add these scripts:

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "bun run index.ts",
    "vercel-build": "prisma generate && prisma migrate deploy"
  }
}
```

### Step 3: Update Backend Index.ts for CORS

Edit `backend/index.ts` - add at the top after imports:

```typescript
import cors from 'cors';

const app = express();

// CORS configuration for production
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

// ... rest of your code
```

Install cors:
```bash
cd backend
npm install cors
npm install --save-dev @types/cors
```

---

## Part 5: Prepare Frontend for Vercel

### Step 1: Update API URL

Create `frontend/.env.production`:

```env
VITE_API_URL=https://your-app.vercel.app/api
```

### Step 2: Update API Calls

Edit `frontend/src/lib/api.ts`:

```typescript
const API = import.meta.env.VITE_API_URL || '/api';
```

### Step 3: Add Build Script

Make sure `frontend/package.json` has:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

---

## Part 6: Deploy to Vercel

### Step 1: Connect GitHub to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Click "Import Git Repository"
4. Find your **renthub** repo and click "Import"

### Step 2: Configure Build Settings

In Vercel dashboard:

**Framework Preset**: Vite

**Root Directory**: `./` (leave as root)

**Build Command**: 
```bash
cd frontend && npm install && npm run build && cd ../backend && npm install && npm run vercel-build
```

**Output Directory**: `frontend/dist`

**Install Command**:
```bash
npm install
```

### Step 3: Add Environment Variables

Click "Environment Variables" tab and add:

| Name | Value |
|------|-------|
| `DATABASE_URL` | Your Neon connection string |
| `DIRECT_URL` | Your Neon connection string (same) |
| `JWT_SECRET` | Generate random string (see below) |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://your-app.vercel.app` (will update) |

**Generate JWT_SECRET:**
Open terminal and run:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output and paste as JWT_SECRET value.

### Step 4: Deploy!

1. Click "Deploy"
2. Wait 2-5 minutes
3. Your app will be live! 🎉

---

## Part 7: Post-Deployment Setup

### Step 1: Update Frontend URL

After deployment, Vercel gives you a URL like:
```
https://renthub-abc123.vercel.app
```

1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Update `FRONTEND_URL` to your actual Vercel URL
3. Redeploy: Go to Deployments tab → Click "..." → "Redeploy"

### Step 2: Run Database Migrations

Open terminal and run:

```bash
cd backend
DATABASE_URL="your-neon-connection-string" npx prisma migrate deploy
```

Or use Neon's SQL editor:
1. Go to Neon dashboard
2. Click "SQL Editor"
3. Copy-paste your migration SQL files
4. Run them

### Step 3: Seed Admin Account

Create a temporary script `backend/seed-prod.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  const passwordHash = await bcrypt.hash('admin@321', 12);
  
  await prisma.user.upsert({
    where: { email: '251905728376@phone.user' },
    update: {
      password_hash: passwordHash,
      role: 'SUPERADMIN',
    },
    create: {
      full_name: 'Yosef Melalaku',
      email: '251905728376@phone.user',
      phone: '+251905728376',
      password_hash: passwordHash,
      role: 'SUPERADMIN',
      is_active: true,
    },
  });
  
  console.log('Admin created!');
}

main();
```

Run it:
```bash
DATABASE_URL="your-neon-connection-string" bun run seed-prod.ts
```

---

## Part 8: Testing Your Deployed App

### Test Checklist:

1. ✅ Visit your Vercel URL
2. ✅ Try to login as admin (+251905728376 / admin@321)
3. ✅ Create a test property as owner
4. ✅ Browse properties as tenant
5. ✅ Check if images upload (if using base64)
6. ✅ Submit a maintenance request
7. ✅ Check super admin dashboard

---

## 🔧 Common Issues & Solutions

### Issue 1: "Cannot connect to database"

**Solution**: 
- Check DATABASE_URL in Vercel env variables
- Make sure it ends with `?sslmode=require`
- Verify Neon project is active

### Issue 2: "API calls failing (404)"

**Solution**:
- Check `vercel.json` routes are correct
- Verify API_URL in frontend `.env.production`
- Check browser console for actual URL being called

### Issue 3: "Prisma Client not found"

**Solution**:
Add to `backend/package.json`:
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### Issue 4: "Build fails"

**Solution**:
- Check build logs in Vercel dashboard
- Make sure all dependencies are in `package.json`
- Verify TypeScript compiles locally: `npm run build`

### Issue 5: "Images not showing"

**Solution**:
If using base64 images, they should work.
For file uploads, you need to use:
- Cloudinary
- Vercel Blob Storage
- AWS S3

---

## 📊 Environment Variables Reference

### Required Variables:

| Variable | Where to Get It | Example |
|----------|----------------|---------|
| `DATABASE_URL` | Neon dashboard | `postgresql://user:pass@host/db` |
| `DIRECT_URL` | Same as DATABASE_URL | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | Generate random string | `abc123...xyz` (64+ chars) |
| `FRONTEND_URL` | Your Vercel URL | `https://your-app.vercel.app` |
| `NODE_ENV` | Set manually | `production` |

### Optional Variables:

| Variable | Purpose | Default |
|----------|---------|---------|
| `PORT` | Backend port | `3000` |
| `CORS_ORIGIN` | Allowed origins | `*` |

---

## 🚀 Continuous Deployment

After initial setup, every time you push to GitHub:

```bash
git add .
git commit -m "Update feature X"
git push
```

Vercel will **automatically**:
1. Detect the push
2. Build your app
3. Run tests (if configured)
4. Deploy to production
5. Send you a notification

---

## 💰 Cost Breakdown

| Service | Free Tier | Paid |
|---------|-----------|------|
| **Vercel** | 100GB bandwidth/month | $20/month (Pro) |
| **Neon** | 0.5GB storage, 3GB transfer | $19/month (Pro) |
| **Total** | **$0/month** | $39/month (if needed) |

**For your use case**: Free tier is sufficient!

---

## 📝 Deployment Checklist

Before deploying:

- [ ] Code pushed to GitHub
- [ ] `.gitignore` excludes `.env` files
- [ ] Neon database created
- [ ] `vercel.json` created
- [ ] CORS configured in backend
- [ ] API URL updated in frontend
- [ ] Environment variables ready
- [ ] Local build works: `npm run build`

During deployment:

- [ ] Vercel project created
- [ ] Environment variables added
- [ ] Build command configured
- [ ] First deployment successful

After deployment:

- [ ] Database migrations run
- [ ] Admin account seeded
- [ ] Login tested
- [ ] All features tested
- [ ] Custom domain added (optional)

---

## 🎓 Next Steps

### 1. Add Custom Domain (Optional)

1. Buy domain (Namecheap, GoDaddy, etc.)
2. In Vercel: Settings → Domains
3. Add your domain
4. Update DNS records (Vercel shows instructions)

### 2. Setup Monitoring

Free tools:
- **Vercel Analytics**: Built-in
- **Sentry**: Error tracking (https://sentry.io)
- **LogRocket**: Session replay

### 3. Optimize Performance

- Enable Vercel Edge Functions
- Add Redis caching (Upstash)
- Optimize images (Vercel Image Optimization)

### 4. Security Enhancements

- Add rate limiting
- Setup HTTPS headers
- Enable Content Security Policy
- Add API authentication

---

## 🆘 Getting Help

If you get stuck:

1. **Check Vercel logs**: Dashboard → Deployments → Click deployment → View logs
2. **Check Neon logs**: Neon Dashboard → Monitoring
3. **Browser console**: F12 → Console tab
4. **Check GitHub Issues**: Search for similar problems

**Common URLs to check:**
- Vercel Dashboard: https://vercel.com/dashboard
- Neon Dashboard: https://console.neon.tech
- GitHub Repo: https://github.com/YOUR_USERNAME/renthub

---

## 🎉 You're Done!

Your RentHub application is now live on the internet! 

**Share your URL:**
```
https://your-app.vercel.app
```

**Admin Login:**
- Phone: +251905728376
- Password: admin@321

**Future updates:**
Just push to GitHub and Vercel deploys automatically! 🚀
