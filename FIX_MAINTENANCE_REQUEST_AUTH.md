# Fix: Maintenance Request Authentication Error

## Problem
When trying to send a maintenance request to the owner, you see:
```
❌ Submission Failed
Missing or invalid authentication header
```

## Root Cause
Your authentication token is either:
1. **Missing** from localStorage (not logged in properly)
2. **Expired** (session timeout)
3. **Invalid** (corrupted token)

## Solution Steps

### Step 1: Check Browser Console 🔍
1. Press **F12** to open Developer Tools
2. Click the **Console** tab
3. Try submitting a maintenance request again
4. Look for these debug messages:

**If you see:**
```
🔍 [TenantMaintenance.handleSubmit] currentUser in localStorage: MISSING
❌ No currentUser found in localStorage!
```
→ **You are not logged in correctly. Go to Step 2.**

**If you see:**
```
🔍 [TenantMaintenance.handleSubmit] User data: { ..., hasToken: false, tokenPreview: 'none' }
```
→ **Your login session is missing the token. Go to Step 2.**

**If you see:**
```
❌ Server error response: { error: 'Unauthorized', message: 'Session token has expired' }
```
→ **Your token expired. Go to Step 2.**

### Step 2: Logout and Login Again 🔄

**Complete Logout Process:**
1. Click your name in the top-right corner
2. Click "Logout"
3. Wait for page to redirect to home

**Clear Browser Data (Important!):**
1. Press **F12** → Console tab
2. Type this command and press Enter:
   ```javascript
   localStorage.clear()
   ```
3. Close Developer Tools

**Fresh Login:**
1. Click "Login" or go to tenant login
2. Enter your phone number: `+251905728376` (or your phone)
3. Enter your password
4. Make sure you see your name in the top right after login

### Step 3: Verify Token is Saved 🔑

1. Press **F12** → Console tab
2. Type this command and press Enter:
   ```javascript
   JSON.parse(localStorage.getItem('currentUser'))
   ```
3. You should see output like:
   ```javascript
   {
     id: "...",
     name: "Yosef Melaku",
     role: "TENANT",
     token: "eyJhbGciOiJ..." // ← Must have this!
   }
   ```

**If `token` is missing or `null`:**
- The login didn't save correctly
- Logout, clear localStorage, and login again

### Step 4: Try Maintenance Request Again ✅

1. Go to Dashboard → Maintenance tab
2. Select your property from dropdown
3. Fill in:
   - Issue title (e.g., "Leaking faucet")
   - Description (e.g., "Kitchen sink is leaking")
   - Severity level
4. Click "Send Maintenance Request to Owner"

You should see:
```
✅ Request Sent!
Success! Your request has been sent to the property owner.
```

---

## Quick Troubleshooting Commands

**Check if you're logged in:**
```javascript
localStorage.getItem('currentUser') !== null
```

**See your user data:**
```javascript
JSON.parse(localStorage.getItem('currentUser'))
```

**Clear all data and start fresh:**
```javascript
localStorage.clear(); location.reload();
```

---

## Common Issues

### Issue: "Please select the property you are renting"
**Cause:** No property selected in dropdown
**Fix:** Select a property from the dropdown at top of form

### Issue: "Please enter an issue title"
**Cause:** Title field is empty
**Fix:** Type a brief title describing the problem

### Issue: "Please describe the problem in detail"
**Cause:** Description field is empty
**Fix:** Type a detailed description in the large text area

### Issue: Error message shows "Authentication error"
**Cause:** Your session expired or token is invalid
**Fix:** Logout → Clear localStorage → Login again

---

## Still Not Working?

1. **Check console logs** - Look for 🔍 and ❌ messages
2. **Take a screenshot** of the console errors
3. **Verify you're logged in as TENANT role** (not OWNER or SUPERADMIN)
4. **Check backend is running** - Try visiting http://localhost:3000/api

---

## Backend Check

If frontend looks good but still failing, check backend:

1. Backend should be running on port 3000
2. Check backend terminal for errors
3. Try this test:
   ```bash
   curl -X GET http://localhost:3000/api/properties
   ```
   Should return a JSON response (not error page)

---

## Prevention

To avoid this issue in future:
1. **Don't close the tab** during login process
2. **Complete login fully** - wait for redirect to dashboard
3. **Check your name appears** in top right corner
4. If you close browser and come back later, you may need to login again (tokens expire after 24 hours)
