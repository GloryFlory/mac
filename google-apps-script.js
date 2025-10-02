/**
 * Google Apps Script for MAC 2025 Photoshoot Booking Sync
 * 
 * This script creates a webhook that allows the booking app to write data
 * back to your Google Sheet, enabling true two-way sync.
 * 
 * Setup Instructions:
 * 1. Go to script.google.com
 * 2. Create a new project
 * 3. Paste this code
 * 4. Set SHEET_ID to your Google Sheet ID
 * 5. Deploy as Web App with "Execute as: Me" and "Access: Anyone"
 * 6. Copy the webhook URL and update photoshootBookings.js
 */

// Your Google Sheet ID
const SHEET_ID = '1q2QLJglIrHWZ-6TzanK7UMWZfsluYc5xfwu-fYwY6ss';
const SHEET_NAME = 'Sheet1'; // Change if your sheet has a different name

/**
 * Handle POST requests from the booking app
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const bookings = data.bookings || [];
    
    // Open the Google Sheet
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    // Clear existing data (except headers)
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 2).clearContent();
    }
    
    // Generate all time slots (same logic as the app)
    const allTimeSlots = generateTimeSlots();
    
    // Prepare data to write
    const dataToWrite = allTimeSlots.map(timeSlot => {
      const booking = bookings.find(b => b.timeSlot === timeSlot);
      return [timeSlot, booking ? booking.names : ''];
    });
    
    // Write all data at once (efficient batch operation)
    if (dataToWrite.length > 0) {
      sheet.getRange(2, 1, dataToWrite.length, 2).setValues(dataToWrite);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: `Updated ${bookings.length} bookings`,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error updating sheet:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle GET requests (for testing)
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      message: 'MAC 2025 Photoshoot Booking Webhook',
      status: 'Active',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Generate time slots (same logic as the app)
 */
function generateTimeSlots() {
  const slots = [];
  const startTime = 14 * 60; // 14:00 (2PM) in minutes
  
  for (let i = 0; i < 40; i++) {
    const timeInMinutes = startTime + (i * 3);
    const hours = Math.floor(timeInMinutes / 60);
    const minutes = timeInMinutes % 60;
    const timeStr = hours.toString().padStart(2, '0') + ':' + minutes.toString().padStart(2, '0');
    slots.push(timeStr);
  }
  
  return slots;
}

/**
 * Test function to verify everything works
 */
function testSync() {
  const testData = {
    bookings: [
      { timeSlot: '14:00', names: 'Test User 1' },
      { timeSlot: '14:15', names: 'Test User 2, Test User 3' }
    ]
  };
  
  const result = doPost({
    postData: {
      contents: JSON.stringify(testData)
    }
  });
  
  console.log('Test result:', result.getContent());
}