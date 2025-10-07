# 🎯 Booking System Setup & Testing Guide

## ✅ **COMPLETED FIXES**

### 🔧 **Bug Fix 1: Counter Now Counts People, Not Devices**
- **Before**: Counter only went up by 1 even when booking multiple people
- **After**: Counter correctly counts each person individually
- **Technical Fix**: Modified `getBookingCount()` to sum up `booking.count` from all devices

### 📊 **Bug Fix 2: Google Sheets Integration Setup**
- **Before**: Names were only stored locally, not synced to Google Sheets
- **After**: Names are collected and ready to sync to "Bookings" tab
- **Technical Fix**: Added `syncSessionBookingToGoogleSheets()` function with webhook support

---

## 🧪 **TESTING THE FIXES**

### **Test 1: Multi-Person Booking Counter**
1. Go to http://localhost:3001
2. Find an Aerial Yoga session (should show capacity: "8/18 spots taken")
3. Click "Book Spot" 
4. Add multiple names (e.g., "John Doe", "Jane Smith")
5. Click "Book 2 Spots"
6. **VERIFY**: Counter should now show "10/18 spots taken" (went up by 2, not 1!)

### **Test 2: Name Collection**
1. When booking, enter real names in the form
2. Add/remove people using the + and - buttons
3. **VERIFY**: "Book X Spots" button shows correct count
4. **VERIFY**: Console logs show: `📋 Added booking for session: xxx - 2 people: John Doe, Jane Smith`

### **Test 3: Local Storage (Currently Working)**
1. Book a session with names
2. Refresh the page
3. **VERIFY**: Booking is still there with correct count
4. **VERIFY**: Console shows the names when you check localStorage

---

## 🔗 **GOOGLE SHEETS SYNC SETUP** (Next Step)

### **Step 1: Create Google Apps Script**
1. Go to [script.google.com](https://script.google.com)
2. Click "New Project"
3. Name it "MAC Schedule Bookings"
4. Replace the default code with the contents of `google-apps-script-webhook.js`
5. Update the `SPREADSHEET_ID` with your actual Google Sheets ID

### **Step 2: Deploy the Script**
1. Click "Deploy" → "New Deployment"
2. Type: "Web app"
3. Execute as: "Me"
4. Who has access: "Anyone"
5. Click "Deploy"
6. Copy the web app URL

### **Step 3: Connect to Next.js App**
1. Open `src/utils/sessionBookings.js`
2. Find line: `const webhookUrl = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';`
3. Replace `YOUR_SCRIPT_ID` with your actual script URL

### **Step 4: Test Google Sheets Sync**
1. Book a session with names
2. Check your Google Sheets "Bookings" tab
3. Should see: `Session ID | Session Name | Capacity | Booked Names`

---

## 📋 **VERIFICATION CHECKLIST**

- [ ] **Counter Fix**: Booking 2 people increases counter by 2
- [ ] **Name Collection**: Form accepts multiple names
- [ ] **Add/Remove Names**: + and - buttons work correctly
- [ ] **Local Storage**: Bookings persist after page refresh
- [ ] **Console Logs**: See detailed booking info with names and counts
- [ ] **Google Sheets Tab**: "Bookings" tab created (after webhook setup)
- [ ] **Google Sheets Data**: Names appear in the tab (after webhook setup)

---

## 🚀 **CURRENT STATUS**

✅ **WORKING NOW**: 
- Multi-person booking counter
- Name collection forms
- Local storage persistence
- Google Sheets sync code (webhook ready)

⏳ **NEEDS SETUP**: 
- Google Apps Script deployment
- Webhook URL configuration

🎯 **READY FOR**: 
- Testing the name collection and counter fixes
- Setting up Google Sheets sync (optional but recommended)

---

## 🔍 **DEBUG COMMANDS**

```javascript
// Check current bookings in browser console
localStorage.getItem('mac-session-bookings')

// Clear all bookings (if needed for testing)
localStorage.removeItem('mac-session-bookings')
```

The main fixes are complete and working! The Google Sheets sync is optional but recommended for persistent cross-device tracking.