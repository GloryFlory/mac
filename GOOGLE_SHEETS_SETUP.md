# 🔄 Two-Way Google Sheets Sync Setup

## ✅ Current Status
Your Google Sheet is connected: https://docs.google.com/spreadsheets/d/1q2QLJglIrHWZ-6TzanK7UMWZfsluYc5xfwu-fYwY6ss/edit

## 📊 What You Get
- **Users book** → Automatically updates Google Sheets
- **You edit Google Sheets** → Users see changes immediately  
- **Real-time sync** in both directions
- **No admin panel needed** - just edit the sheet directly

## � Setup Steps for Two-Way Sync

### Step 1: Make Your Sheet Public (if not done)
1. Open your Google Sheet
2. Click **Share** → **"Anyone with the link can view"**
3. ✅ Done!

### Step 2: Set Up Google Apps Script Webhook
1. Go to [script.google.com](https://script.google.com)
2. Click **"New Project"**
3. Copy the code from `google-apps-script.js` file in this project
4. Paste it into the script editor
5. Save the project (name it "MAC Photoshoot Sync")

### Step 3: Deploy the Webhook
1. Click **Deploy** → **New Deployment**
2. Click the gear icon → **Web App**
3. Set **Execute as**: "Me"
4. Set **Who has access**: "Anyone"
5. Click **Deploy**
6. **Copy the webhook URL** (it will look like: `https://script.google.com/macros/s/...`)

### Step 4: Update the App
1. Open `src/utils/photoshootBookings.js`
2. Replace `YOUR_GOOGLE_APPS_SCRIPT_WEBHOOK_URL` with your webhook URL
3. Save the file

## 🎯 How It Works

### For Users:
- Open booking modal → Sees current Google Sheets data
- Makes booking → Instantly updates Google Sheets
- Cancels booking → Instantly removes from Google Sheets

### For You (Admin):
- Edit names directly in Google Sheets
- Add bookings: Enter names like `John Doe, Jane Smith`
- Remove bookings: Clear the cell
- Changes appear immediately when users open booking modal

## 🧪 Testing the Setup

1. Make a test booking in the app
2. Check your Google Sheet - it should update automatically
3. Edit a name in Google Sheets
4. Refresh the booking modal - should show your changes

## ⚡ Benefits

- **No admin interface needed** - just use Google Sheets
- **Real-time collaboration** - multiple admins can edit
- **Automatic backups** - Google Sheets saves everything
- **Mobile friendly** - edit on phone using Google Sheets app
- **Export ready** - your sheet is always up-to-date for printing

## 🔧 Troubleshooting

**Bookings not syncing to Google Sheets?**
- Check that Google Apps Script webhook is deployed correctly
- Verify the webhook URL in `photoshootBookings.js`

**Google Sheets changes not showing in app?**
- Make sure sheet is public (viewable by anyone with link)
- Check browser console for any errors

**Need to reset everything?**
- Clear all data in Google Sheets (keep headers)
- App will start fresh on next booking

## How to manage bookings as admin

1. **Add booking**: Enter names in the "Names" column like: `John Doe, Jane Smith`
2. **Remove booking**: Clear the "Names" cell
3. **View all bookings**: The app will automatically sync with your changes

The app checks Google Sheets when users open the booking modal, so changes appear in real-time!

## Example sheet structure

| Time Slot | Names |
|-----------|-------|
| 14:00     | John Doe |
| 14:03     | Jane Smith, Bob Wilson |
| 14:06     | |
| 14:09     | Alice Cooper |
| ...       | ... |

## Troubleshooting

- **"Could not connect"**: Check that the sheet is public and the URL is correct
- **"No bookings found"**: Make sure column headers are exactly "Time Slot" and "Names"
- **"Data not syncing"**: The app checks Google Sheets when booking modal opens - try refreshing

## Security Note

- Google Sheets integration is **read-only** from the app
- Users can still make bookings through the app (stored locally)
- Admin can override any booking by editing the Google Sheet
- For full two-way sync, you'd need Google Apps Script (advanced setup)