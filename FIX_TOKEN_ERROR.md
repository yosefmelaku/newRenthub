# ✅ How to Fix "Invalid or malformed certificate token" Error

## Problem
The error **"Cannot Save Property - Invalid or malformed certificate token"** means your login session has expired or the JWT token in your browser is invalid.

---

## ✅ SOLUTION (Takes 30 seconds)

### Step 1: Logout
1. Click your profile icon in the top right
2. Click "Logout"

### Step 2: Clear Browser Storage (IMPORTANT)
1. Open browser console (Press `F12`)
2. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Click "Local Storage" → `http://localhost:5173`
4. Delete the `currentUser` key (or click "Clear All")
5. Close the console

### Step 3: Login Again
1. Go back to login page
2. Login with your credentials:
   - **Owner**: Phone: `+251911111111`, Password: `test123`
   - **Tenant**: Phone: `+251922222222`, Password: `test123`
   - **Superadmin**: Phone: `+251905728376`, Password: `admin@321`

### Step 4: Try Upload Again
1. Go to "My Properties"
2. Click "Add New Property"
3. Upload image
4. Fill details
5. Click "Save Property"
6. **Should work now!** ✅

---

## Why This Happens

JWT tokens have an expiration time. When you login, you get a token that's valid for a certain period (usually 24 hours or 7 days). After that time, the token expires and you need to login again.

Also, if you:
- Changed the `JWT_SECRET` in `.env`
- Cleared the database
- Restarted the backend multiple times
- Manually edited localStorage

...the token becomes invalid.

---

## Code Improvements Made

I've updated the code to show a clearer error message:

**Before:**
```
"Invalid or malformed certificate token"
```

**After:**
```
"Session expired. Please logout and login again to continue."
```

And the app will automatically clear the invalid token from localStorage.

---

## Quick Fix Command (Alternative)

If you don't want to logout/login, you can clear localStorage via browser console:

```javascript
localStorage.removeItem('currentUser');
window.location.reload();
```

Then login again.

---

## Prevention

To avoid this in the future:
1. Don't manually edit localStorage
2. Don't change `JWT_SECRET` in production
3. Login regularly (tokens expire after 24h-7d depending on config)
4. The app will auto-logout on token expiry in the future

---

## Still Not Working?

If you still get errors after logout/login:

1. **Check Backend is Running**
   ```bash
   cd backend
   bun run index.ts
   ```
   
2. **Check Frontend is Running**
   ```bash
   cd frontend
   bun run dev
   ```

3. **Check Database Connection**
   - Make sure PostgreSQL is running
   - Check `backend/.env` has correct `DATABASE_URL`

4. **Check Cloudinary Credentials** (if image upload still fails)
   - Add your Cloudinary credentials to `backend/.env`
   - See `CLOUDINARY_SETUP.md` for instructions

---

## Summary

**Problem**: Token expired
**Solution**: Logout → Clear localStorage → Login again
**Time**: 30 seconds
**Result**: Upload works perfectly ✅
