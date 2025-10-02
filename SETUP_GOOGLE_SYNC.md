# ⚡ Quick Google Sheets Sync Setup

## Current Status: ⚠️ App → Google Sheets sync not active
- ✅ Google Sheets → App (working - you can edit the sheet and see changes)
- ❌ App → Google Sheets (needs 2-minute setup below)

## 🚀 Enable Full Two-Way Sync (2 minutes)

### Step 1: Deploy the Google Apps Script
1. Click this link: [**Deploy Google Apps Script**](https://script.google.com/d/1example/edit)
2. **OR** Go to [script.google.com](https://script.google.com) and create new project
3. Replace all code with this:

```javascript
// MAC 2025 Photoshoot Booking Sync
const SHEET_ID = '1q2QLJglIrHWZ-6TzanK7UMWZfsluYc5xfwu-fYwY6ss';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const bookings = data.bookings || [];
    
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Sheet1');
    
    // Clear existing data except headers  
    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).clearContent();
    }
    
    // Generate all time slots (14:00-15:57, 3min intervals)
    const allTimeSlots = [];
    for (let i = 0; i < 40; i++) {
      const timeInMinutes = 840 + (i * 3); // 14:00 + 3min intervals
      const hours = Math.floor(timeInMinutes / 60);
      const minutes = timeInMinutes % 60;
      allTimeSlots.push(hours.toString().padStart(2, '0') + ':' + minutes.toString().padStart(2, '0'));
    }
    
    // Prepare data to write
    const dataToWrite = allTimeSlots.map(timeSlot => {
      const booking = bookings.find(b => b.timeSlot === timeSlot);
      return [timeSlot, booking ? booking.names : ''];
    });
    
    // Write all data at once
    if (dataToWrite.length > 0) {
      sheet.getRange(2, 1, dataToWrite.length, 2).setValues(dataToWrite);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      updated: bookings.length,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. **Save** the project (Ctrl+S) - name it "MAC Photoshoot Sync"

### Step 2: Deploy as Web App
1. Click **Deploy** → **New Deployment**
2. Click the ⚙️ gear icon → Select **Web App**
3. Set **Execute as**: "Me"  
4. Set **Who has access**: "Anyone"
5. Click **Deploy**
6. **Copy the web app URL** (starts with `https://script.google.com/macros/s/...`)

### Step 3: Update Your App
1. Open `src/utils/photoshootBookings.js` in your code
2. Find line 8: `const GOOGLE_APPS_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEBHOOK_URL';`
3. Replace with: `const GOOGLE_APPS_SCRIPT_URL = 'YOUR_COPIED_URL_HERE';`
4. Save the file

### Step 4: Test It! 
1. Make a test booking in the app
2. Success message should say "📊 Synced to Google Sheets"
3. Check your Google Sheet - the booking should appear!

## ✅ Once Working:
- **User books** → Instantly appears in Google Sheets
- **You edit Google Sheets** → Users see changes immediately
- **Perfect two-way sync!**

## 🎯 Why This is Better Than Download:
- **Real-time collaboration** - multiple people can manage the sheet
- **Always up-to-date** - no need to download/upload files  
- **Mobile friendly** - edit bookings from your phone
- **Automatic backup** - Google handles all the storage
- **Professional** - share the live Google Sheet with your team