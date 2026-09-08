# How to Add a Property Successfully

## Step-by-Step Guide

### STEP 1: Upload Property Image ✅

1. Click "Add Property" button
2. **You must upload an image first** - drag & drop or click to browse
3. Supported formats: JPG, PNG, WEBP (max 5 MB)
4. Click "Next: Add Details" button

### STEP 2: Fill Property Details ✅

Fill in ALL required fields (marked with red *):

#### Basic Information
- **Property Title** - Example: "Bole Garden Villa"
- **Property Type** - Choose: House, Villa, Office, or Studio
- **City** - Select from dropdown
- **Monthly Rent (USD)** - Enter amount (e.g., 2500)

#### Location Details

**If City = Addis Ababa:**
- ⚠️ **IMPORTANT**: You MUST select a Sub-City/Area from the dropdown
- Common areas: Bole, Kirkos, Yeka, Nifas Silk-Lafto, etc.
- **Do NOT leave this empty** - this is the most common validation error

**If City = Other (not Addis Ababa):**
- Fill in the Full Address field (e.g., "123 Main St, Dire Dawa, Ethiopia")

#### Property Features

**For House/Villa/Studio:**
- **Bedrooms** - Enter number (default: 2)
- **Bathrooms** - Enter number (default: 1)

**For Office:**
- **Size (sqm)** - Enter office size (e.g., 120)
- **Meeting Rooms** - Enter number (default: 1)
- **Parking Spaces** - Enter number (default: 0)

#### Additional Fields
- **Rooms/Units for rent** - Default: 1
  - If you have multiple rooms/units, increase this number
  - When all units are rented, listing becomes unavailable

### STEP 3: Save ✅

1. Click "Save Property" button
2. Wait for the green success message
3. Your property will appear in the list

---

## Common Errors and Solutions

### ❌ "Please select an Addis Ababa area"
**Problem**: City is set to "Addis Ababa" but you didn't select a subcity
**Solution**: Open the "Sub-City / Area in Addis Ababa" dropdown and select an area (e.g., Bole)

### ❌ "Please enter the full address"
**Problem**: City is NOT Addis Ababa but address field is empty
**Solution**: Type the complete address in the "Full Address" field

### ❌ "Please enter office size in sqm"
**Problem**: Property type is "Office" but office size is empty
**Solution**: Enter the office size (e.g., 120)

### ❌ "Please enter bedrooms and bathrooms"
**Problem**: Property type is NOT office but beds/baths are empty
**Solution**: Fill in the number of bedrooms and bathrooms

### ❌ "Please upload a property image first"
**Problem**: Trying to go to Step 2 without uploading an image
**Solution**: Go back to Step 1 and upload an image

### ❌ "Failed to save property - Missing or invalid authentication header"
**Problem**: Your login session has expired or token is missing
**Solution**: 
1. Open browser console (F12) and check for 🔍 debug logs
2. Logout from the top-right menu
3. Login again with your credentials
4. Try adding the property again

---

## Debugging Tips

1. **Open Browser Console** (Press F12)
2. Look for console messages starting with:
   - 🔍 = Debug information
   - ❌ = Errors
   - ✅ = Success

3. **Common Console Messages:**
   - `"Validation failed: [error message]"` - Check the error and fix the form field
   - `"No owner ID found"` - You need to login again
   - `"Save failed: Missing or invalid authentication header"` - Token issue, logout and login again

---

## Quick Checklist Before Saving

- [ ] Image uploaded (shows preview)
- [ ] Property title filled
- [ ] Property type selected
- [ ] City selected
- [ ] **If Addis Ababa**: Subcity selected from dropdown
- [ ] **If NOT Addis Ababa**: Full address typed
- [ ] Monthly rent entered (number only)
- [ ] **If Office**: Office size (sqm) entered
- [ ] **If House/Villa/Studio**: Bedrooms and bathrooms entered
- [ ] Rooms/Units value is correct (minimum 1)

---

## Example: Adding a House in Bole

```
✅ Step 1: Upload image (e.g., house-photo.jpg)

✅ Step 2: Fill form:
   - Title: "Modern 3BR House in Bole"
   - Type: House
   - City: Addis Ababa
   - Sub-City: Bole  ← MUST SELECT THIS
   - Bedrooms: 3
   - Bathrooms: 2
   - Monthly Rent: 3500
   - Rooms/Units: 1

✅ Step 3: Click "Save Property"
```

---

## Still Having Issues?

Check the browser console for detailed error messages. The console will show exactly which validation failed or what the server error is.

**To open console:**
- Windows: Press F12 or Ctrl+Shift+I
- Mac: Press Cmd+Option+I

Look for messages with the 🔍 emoji - they contain helpful debugging information.
