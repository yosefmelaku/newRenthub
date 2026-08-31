# RentHub Backend - Quick Start Guide

## 🎯 Default Super Admin Credentials

```
Phone:    +251905728376
Password: admin321
```

## 📋 Prerequisites

1. PostgreSQL running on `localhost:5432`
2. Database: `rentalsystem`
3. Bun installed

## 🚀 Start Backend Server

```bash
cd backend
bun --watch index.ts
```

The server should start on **http://localhost:5000**

You should see:
```
Server is listening on http://0.0.0.0:5000 (all interfaces)
```

## ✅ Test the Backend

### 1. Check if server is running
Open browser: http://localhost:5000

Should see: "Rental System PostgreSQL API is running!"

### 2. Test login endpoint
```bash
bun test-login.ts
```

Should return status 200 with user data and token.

### 3. Check admin account exists
```bash
bun check-admin.ts
```

Should show the superadmin account details.

## 🔧 Troubleshooting

### CORS errors in browser
- Make sure backend is on port 5000
- Make sure frontend proxy is configured (vite.config.ts)
- Restart both servers after changes

### Database connection errors
- Check `.env` file has correct `DATABASE_URL`
- Verify PostgreSQL is running: `pg_isready`
- Test connection: `bun check-admin.ts`

### "No account found" error
- Run seed script: `bun ./prisma/seed.ts`
- Verify with: `bun check-admin.ts`

## 📝 Environment Variables

Create `.env` file in backend folder:

```env
DATABASE_URL=postgresql://postgres:Yosef%401223@localhost:5432/rentalsystem
JWT_SECRET=super_secret_renthub_key_2026_jwt_token_auth_sign_flow!
ALLOWED_ORIGINS=http://localhost:5173
TRUST_PROXY=true
```

## 🌐 Starting Full Stack

Terminal 1 (Backend):
```bash
cd backend
bun --watch index.ts
```

Terminal 2 (Frontend):
```bash
cd frontend
bun run dev
```

Then open: **http://localhost:5173/admin**

Log in with: `+251905728376` / `admin321`
