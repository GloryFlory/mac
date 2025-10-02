# 🔐 Admin Access for MAC 2025 Schedule

## Admin Features

The MAC 2025 schedule app includes admin features for managing photoshoot bookings through Google Sheets integration.

### 🎯 How to Access Admin Panel

**Keyboard Shortcut**: `Ctrl + Shift + A`

- This opens the admin setup modal
- Only you (as the admin) know this shortcut
- No visible admin button for regular users
- Secure and hidden from attendees

### 🛠️ Admin Functions

1. **View Connection Status**: See if app is connected to Google Sheets
2. **Refresh Bookings**: Manually sync from Google Sheets
3. **Setup Instructions**: Complete Google Sheets integration guide
4. **Test Connection**: Verify everything is working

### 📊 Google Sheets Management

**Your Sheet**: https://docs.google.com/spreadsheets/d/1q2QLJglIrHWZ-6TzanK7UMWZfsluYc5xfwu-fYwY6ss/edit

**How to manage bookings**:
- Edit the "Names" column directly in Google Sheets
- Format: `John Doe, Jane Smith` for multiple people  
- Leave empty for available slots
- Changes sync automatically when users open booking modal

### 🔒 Security Features

- **No visible admin controls** for regular users
- **Keyboard shortcut access only** (Ctrl+Shift+A)
- **Device-based booking ownership** - users can only edit their own bookings
- **Google Sheets read-only** - app reads from your sheet, users can't write to it
- **Local fallback** - if Google Sheets unavailable, uses local storage

### 🚀 Quick Admin Tasks

1. **Check bookings**: Open your Google Sheet
2. **Sync manually**: Ctrl+Shift+A → "Refresh from Google Sheets"
3. **Add/remove bookings**: Edit directly in Google Sheets
4. **Export schedule**: Available in booking modal for users

### 📋 Time Slots

- **40 slots** from 14:00 to 15:57
- **3-minute intervals**
- **2 people maximum** per slot
- **Saturday photoshoot session**

This setup gives you full admin control while keeping the interface clean and secure for regular users!