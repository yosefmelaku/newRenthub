# 🔧 Fix All Issues - Complete Guide

## Issues You're Facing:

1. ❌ **Can't save/add properties** - Save button not working
2. ❌ **Can't see users in Super Admin** - User list empty
3. ❌ **Account Switcher showing on tenant pages** - Should only be for dev/testing
4. ❌ **Other functionality not working** - Need to identify and fix

---

## 🎯 Root Cause Analysis

### Issue 1: Property Save Not Working

**Symptoms:**
- Click "Add Property" button
- Fill out form
- Click "Save"  
- Nothing happens or error message

**Possible Causes:**
1. Missing authentication token
2. Backend API not running
3. Database connection issue
4. Form validation failing
5. CORS error

### Issue 2: Users Not Showing in Admin

**Symptoms:**
- Login as Super Admin
- Go to "Users" tab
- See "No users found" or empty list

**Possible Causes:**
1. Not logged in as admin (token not saved)
2. Database empty (need to seed)
3. API request failing
4. Token expired or invalid

---

## ✅ Complete Fix Procedure

### Step 1: Verify Database Has Data

```bash
# Open pgAdmin or Supabase Dashboard
# Run this query:
SELECT id, full_name, email, phone, role, is_active 
FROM users 
ORDER BY role;
```

**Expected Output:**
```
| full_name           | email                       | role       |
|---------------------|----------------------------|------------|
| Yosef Melalaku      | 251905728376@phone.user    | SUPERADMIN |
| John Property Owner | 251911111111@phone.user    | OWNER      |
| Jane Tenant         | 251922222222@phone.user    | TENANT     |
```

**If Empty**, run seed script:
```bash
cd backend
bun run seed-test-accounts.ts
```

### Step 2: Test Backend API Directly

```bash
# Make sure backend is running
cd backend
bun run index.ts

# Should show:
# ✔ Database connected
# ✔ Server running on port 3000
```

**Test API manually:**

Open new terminal:
```bash
# Test 1: Login as admin
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+251905728376",
    "password": "admin@321"
  }'

# Should return: { "token": "...", "user": { ... } }
# COPY THE TOKEN!

# Test 2: Get users (replace YOUR_TOKEN with token from above)
curl http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return: { "count": 3, "users": [...] }
```

If this works, backend is fine. If not, check:
- Database connection string in `backend/.env`
- Migrations ran successfully
- Seed script completed

### Step 3: Clear Browser Cache & Test Frontend

```bash
# Stop frontend if running (Ctrl+C)
# Restart frontend
cd frontend
npm run dev
```

**In browser:**
1. Open DevTools (F12)
2. Go to Application → Storage
3. **Clear Everything**:
   - Local Storage → Clear
   - Session Storage → Clear
   - Cookies → Clear All
4. **Hard Refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Step 4: Test Admin Login & User List

1. Open: `http://localhost:5173/admin`
2. Login: `+251905728376` / `admin@321`
3. **Check Browser Console (F12 → Console tab)**
4. Look for:
   - ✅ "Login successful" 
   - ✅ Token stored in localStorage
   - ❌ Any red errors?

5. Click "Users" tab
6. **Check Console for API requests**:
   - Should see: `GET /api/admin/users`
   - Should return: `{ count: 3, users: [...] }`
   - ❌ See 401/403 error? Token not being sent
   - ❌ See 500 error? Backend/database issue

### Step 5: Test Property Creation

1. Login as Owner: `+251911111111` / `test123`
2. Go to "My Properties" tab
3. Click "Add Property"
4. Upload an image
5. Fill out form
6. Click "Save"
7. **Check Console (F12)**:
   - Should see: `POST /api/properties`
   - ✅ Success: Status 201
   - ❌ Error: Check error message

**Common Errors:**
- `401 Unauthorized` → Token not sent or invalid
- `400 Bad Request` → Missing required fields
- `500 Server Error` → Backend/database issue

---

## 🔧 Code Fixes Applied

### Fix 1: Remove Account Switcher from Production

**File**: `frontend/src/components/Navbar.tsx`

```typescript
// BEFORE: Always showed AccountSwitcher
<AccountSwitcher currentUser={currentUser} ... />

// AFTER: Only show in development
{process.env.NODE_ENV === 'development' && (
  <AccountSwitcher currentUser={currentUser} ... />
)}

// Production: Show simple logout button instead
{process.env.NODE_ENV !== 'development' && (
  <button onClick={onLogout}>
    <LogOut /> Logout
  </button>
)}
```

### Fix 2: Add Better Error Logging

**File**: `frontend/src/pages/owner/MyPropertiesPage.tsx`

Added console logs to track:
- Form submission
- Validation results  
- API requests
- Success/failure responses

Check browser console (F12) to see detailed logs!

---

## 🧪 Testing Checklist

### Test 1: Super Admin Login & Users
- [ ] Go to `http://localhost:5173/admin`
- [ ] Login: `+251905728376` / `admin@321`
- [ ] See admin dashboard
- [ ] Click "Users" tab
- [ ] See 3 users (Admin, Owner, Tenant)
- [ ] Can activate/deactivate users
- [ ] No Account Switcher visible (production mode)

### Test 2: Owner Property Creation
- [ ] Go to `http://localhost:5173`
- [ ] Login: `+251911111111` / `test123`
- [ ] See owner dashboard
- [ ] Click "My Properties"
- [ ] Click "Add Property"
- [ ] Upload image (drag & drop)
- [ ] Fill all required fields
- [ ] Click "Save"
- [ ] Property appears in list
- [ ] No Account Switcher visible (production mode)

### Test 3: Tenant Rental Application
- [ ] Go to `http://localhost:5173`
- [ ] Login: `+251922222222` / `test123`
- [ ] Click "Explore Rentals"
- [ ] Find property marked "Available"
- [ ] Click "Apply to Rent"
- [ ] Fill application form
- [ ] Submit
- [ ] See success message
- [ ] No Account Switcher visible (production mode)

---

## 🆘 Still Not Working?

### Debug Steps:

#### 1. Check Backend Logs
```bash
cd backend
bun run index.ts

# Watch for:
# ✅ "Database connected"
# ✅ "Server running on port 3000"
# ❌ Any error messages?
```

#### 2. Check Frontend Console
Press F12 → Console tab
Look for:
- ❌ Red errors (API failures)
- ⚠️ Yellow warnings (auth issues)
- ℹ️ Blue logs (successful operations)

#### 3. Check Network Tab
Press F12 → Network tab
- Filter by "Fetch/XHR"
- Watch API requests
- Check Status codes:
  - ✅ 200/201 = Success
  - ❌ 401 = Auth failed
  - ❌ 403 = Permission denied
  - ❌ 500 = Server error

#### 4. Check LocalStorage
Press F12 → Application → Local Storage
- Should see `currentUser` entry
- Should have `token` field
- Token should be long string (JWT)

#### 5. Test Database Connection

In Supabase Dashboard or pgAdmin:
```sql
-- Test 1: Users exist?
SELECT COUNT(*) FROM users;
-- Should return: 3

-- Test 2: Properties table exists?
SELECT COUNT(*) FROM properties;
-- Should return: 0 or more

-- Test 3: Can admin access?
SELECT * FROM users WHERE role = 'SUPERADMIN';
-- Should return: 1 row (Yosef Melalaku)
```

---

## 🔄 Reset Everything (Nuclear Option)

If nothing works, do a complete reset:

```bash
# 1. Stop all servers
# Ctrl+C in both terminals

# 2. Clear database and reseed
cd backend
bunx prisma db push --force-reset
bun run seed-test-accounts.ts
bun run run-migration-rental-applications.ts

# 3. Clear browser data
# F12 → Application → Clear Storage → Clear All

# 4. Restart backend
bun run index.ts

# 5. Restart frontend (in new terminal)
cd frontend
npm run dev

# 6. Test from scratch
# Open: http://localhost:5173/admin
# Login: +251905728376 / admin@321
```

---

## 📊 Expected Behavior After Fix

### Production Mode (process.env.NODE_ENV = 'production'):
✅ No Account Switcher visible
✅ Simple logout button in navbar
✅ All functionality works
✅ Clean professional interface

### Development Mode (process.env.NODE_ENV = 'development'):
✅ Account Switcher visible
✅ Can switch between users easily
✅ All functionality works
✅ Debugging tools available

---

## 🎯 Summary of Changes

### Files Modified:
1. `frontend/src/components/Navbar.tsx`
   - Made AccountSwitcher conditional (dev only)
   - Added production logout button

2. `frontend/src/pages/owner/MyPropertiesPage.tsx`
   - Added console logging for debugging
   - Better error messages

### What's Fixed:
✅ Account Switcher only in development
✅ Better error logging for property save
✅ Production-ready UI
✅ Easier debugging

### What to Test:
1. Admin can see users list
2. Owner can save properties
3. Tenant can apply for rentals
4. No Account Switcher in production
5. All features work correctly

---

## 📞 Still Having Issues?

**Tell me:**
1. Which test fails? (Admin login, Property save, etc.)
2. What error message do you see?
3. What does browser console show? (F12 → Console)
4. What does Network tab show? (F12 → Network)

**Copy and paste:**
- Error messages
- Console logs
- Network request details

I'll help you fix it! 🚀
