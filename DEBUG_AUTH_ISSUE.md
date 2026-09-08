# Debug: Owner Dashboard Authentication Error

## Problem
"Failed to load properties - Missing or invalid authentication header" appears even though we passed the `user` prop to `MyPropertiesPage`.

## Possible Causes

### 1. **Token Not Stored in localStorage**
When you log in, the token might not be getting saved properly.

**To Check:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Type: `localStorage.getItem('currentUser')`
4. Press Enter

**Expected Result:**
```json
{
  "id": "some-user-id",
  "name": "Your Name",
  "email": "youremail@example.com",
  "role": "OWNER",
  "phone": "+251...",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
}
```

**If NULL or Missing Token:**
- The backend login API is not returning a token
- Check backend `/api/users/login` endpoint

### 2. **Token Expired or Invalid**
The JWT token might be expired or malformed.

**To Check:**
1. Copy the token value from localStorage
2. Go to https://jwt.io
3. Paste the token in the "Encoded" section
4. Check the `exp` (expiration) timestamp

**If Expired:**
- Log out and log in again to get a new token

### 3. **Role Mismatch**
The user might not have the "OWNER" role.

**To Check:**
```javascript
const user = JSON.parse(localStorage.getItem('currentUser'));
console.log('User Role:', user.role);
```

**Expected:** `"OWNER"` or `"owner"`

**If Wrong Role:**
- You logged in with a TENANT or SUPERADMIN account
- Log out and log in with an owner account

### 4. **Backend Not Running**
The backend API server might not be running.

**To Check:**
1. Open a new terminal
2. Navigate to backend folder: `cd backend`
3. Check if server is running on port 5000

**If Not Running:**
```bash
cd backend
npm run dev
# or
bun run dev
```

### 5. **CORS or Proxy Issues**
The frontend might not be able to reach the backend.

**To Check:**
1. Open DevTools → Network tab
2. Refresh the page
3. Look for the API call to `/api/properties/owner/...`
4. Check the response

**If 401 Unauthorized:**
- Token is invalid or missing
- Follow steps in cause #1

**If No Request Appears:**
- Frontend might not be making the API call
- Check if `ownerId` is empty

### 6. **User ID or Email Missing**
The user object might not have an `id` or `email` field.

**To Check:**
```javascript
const user = JSON.parse(localStorage.getItem('currentUser'));
console.log('User ID:', user.id);
console.log('User Email:', user.email);
```

**Expected:** At least one should have a value

**If Both Empty:**
- Backend signup/login is not returning user ID
- Check backend `auth.controller.ts`

---

## Step-by-Step Debugging

### Step 1: Check if User is Logged In
Open browser console and run:
```javascript
const currentUser = localStorage.getItem('currentUser');
console.log('Current User:', currentUser);
if (currentUser) {
  const user = JSON.parse(currentUser);
  console.log('Parsed User:', user);
  console.log('Has Token?', !!user.token);
  console.log('Has ID?', !!user.id);
  console.log('Has Email?', !!user.email);
  console.log('Role:', user.role);
}
```

### Step 2: Check API Headers
In the Network tab, find the failing request to `/api/properties/owner/...`

**Check Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**If Missing:**
- The `authHeaders()` function in `lib/api.ts` is not reading the token
- localStorage doesn't have the token

### Step 3: Test API Directly
In console, test if the API works:
```javascript
const user = JSON.parse(localStorage.getItem('currentUser'));
const token = user.token;
const ownerId = user.id || user.email;

fetch(`/api/properties/owner/${ownerId}`, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => console.log('API Response:', data))
.catch(err => console.error('API Error:', err));
```

**Expected:** List of properties or empty array

**If 401 Error:**
- Token is invalid
- User doesn't exist in database
- Session expired

### Step 4: Check Backend Logs
In the backend terminal, you should see logs when the API is called.

**Look for:**
```
[loadUserFromHeader] ...
```

**If you see "Missing or invalid authentication header":**
- The Authorization header is not being sent
- Check frontend API call

---

## Quick Fixes

### Fix 1: Force Re-Login
1. Click "Logout"
2. Clear browser localStorage:
   ```javascript
   localStorage.clear();
   ```
3. Refresh page
4. Log in again as OWNER

### Fix 2: Check User Role in Database
The user might be stored as "TENANT" instead of "OWNER".

**Using Prisma Studio:**
```bash
cd backend
npx prisma studio
```

1. Open `User` table
2. Find your user by phone number
3. Check the `role` column
4. If it says "TENANT", change it to "OWNER"
5. Save

### Fix 3: Create a Test Owner Account
```bash
cd backend
# Create a script or use Prisma Studio
```

In Prisma Studio:
1. Go to `User` table
2. Click "Add record"
3. Fill in:
   - full_name: "Test Owner"
   - phone: "+251999999999"
   - email: "owner@test.com"
   - role: "OWNER"
   - password_hash: (hash of "password123")
   - is_active: true
4. Save

Or use the signup page and select "Owner" role.

### Fix 4: Verify Backend Environment
Check `backend/.env` file has:
```env
JWT_SECRET=your-secret-key-here
DATABASE_URL=postgresql://...
```

If `JWT_SECRET` is missing:
```bash
cd backend
# Add to .env:
JWT_SECRET=my-super-secret-jwt-key-change-this-in-production
```

Restart backend server.

---

## Common Mistakes

### ❌ Logging in as Tenant
- Tenant accounts don't have access to "My Properties"
- Log in as OWNER role

### ❌ Token Expired
- JWT tokens have expiration
- Log out and log in again

### ❌ Backend Not Running
- Frontend runs on port 5173 (Vite)
- Backend must run on port 5000
- Both need to be running

### ❌ Wrong Environment
- Using production database instead of local
- Check `DATABASE_URL` in `.env`

### ❌ Browser Cache
- Old auth data cached
- Clear localStorage and cookies
- Hard refresh (Ctrl+Shift+R)

---

## Testing the Fix

After trying the fixes:

1. **Log out completely**
2. **Clear localStorage:**
   ```javascript
   localStorage.clear();
   ```
3. **Refresh page (Ctrl+R)**
4. **Sign up as OWNER:**
   - Go to signup page
   - Select "Owner" role
   - Fill in details
   - Create account
5. **Navigate to "My Properties"**
6. **Should see either:**
   - Empty state: "No properties yet"
   - Or existing properties list

If still failing, check backend logs for detailed error messages.

---

## Get More Info

Add this temporary logging in `MyPropertiesPage.tsx`:

```typescript
const ownerId = user?.id ?? user?.email ?? getOwnerIdFromSession() ?? '';

// ADD THIS DEBUG LOG:
console.log('🔍 MyPropertiesPage Debug:', {
  hasUser: !!user,
  userId: user?.id,
  userEmail: user?.email,
  ownerId,
  sessionUser: getOwnerIdFromSession(),
  localStorage: localStorage.getItem('currentUser')
});
```

Then check the browser console when you open "My Properties" page.

---

**Need More Help?**
Share the console output from the debug steps above!
