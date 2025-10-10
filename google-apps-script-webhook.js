/**
 * Google Apps Script for MAC Schedule Booking System
 * 
 * This script handles webhook requests from the Next.js app to update
 * the "Bookings" tab in your Google Sheets with names and booking counts.
 * 
 * Setup Instructions:
 * 1. Open Google Apps Script (script.google.com)
 * 2. Create a new project called "MAC Schedule Bookings"
 * 3. Replace the default code with this script
 * 4. Save and deploy as a web app with "Execute as: Me" and "Who has access: Anyone"
 * 5. Copy the web app URL and replace YOUR_SCRIPT_ID in sessionBookings.js
 */

function doPost(e) {
  try {
    // Log the incoming request for debugging
    console.log('📥 Webhook called with data:', e);
    
    // Check if we have the expected data structure
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('Invalid request structure - missing postData.contents');
    }
    
    console.log('📥 Post data:', e.postData);
    
    // Parse the incoming request
    const data = JSON.parse(e.postData.contents);
    const { sessionId, names, count, timestamp } = data;
    
    console.log('📋 Parsed booking data:', { sessionId, names, count, timestamp });
    
    // Open the spreadsheet (your MAC Schedule spreadsheet)
    const SPREADSHEET_ID = '11-6l7HgRwZzFrQ22Ny8_d-wvimahJdBcceuy9OBEMAM';
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Get the "Bookings" tab (or create if it doesn't exist)
    let bookingsSheet = spreadsheet.getSheetByName('Bookings');
    if (!bookingsSheet) {
      console.log('📊 Creating new Bookings tab');
      bookingsSheet = spreadsheet.insertSheet('Bookings');
      // Add headers
      bookingsSheet.getRange(1, 1, 1, 4).setValues([
        ['Session ID', 'Session Name', 'Capacity', 'Booked Names']
      ]);
    }
    
    // Find existing row for this session ID or create new one
    const data_range = bookingsSheet.getDataRange();
    const values = data_range.getValues();
    let targetRow = -1;
    
    // Look for existing session ID
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === sessionId) {
        targetRow = i + 1; // +1 because getRange is 1-indexed
        break;
      }
    }
    
    // Get session name and capacity from the main schedule
    const { sessionName, capacity } = getSessionInfo(spreadsheet, sessionId);
    console.log('📝 Session info:', { sessionName, capacity });
    
    if (targetRow > 0) {
      // Update existing row with the merged names from client
      if (count > 0) {
        console.log('📝 Updating existing booking row:', targetRow, 'with names:', names);
        bookingsSheet.getRange(targetRow, 4).setValue(names); // Update names
      } else {
        // Remove booking (count is 0)
        console.log('🗑️ Removing booking row:', targetRow);
        bookingsSheet.deleteRows(targetRow, 1);
      }
    } else if (count > 0) {
      // Add new row
      console.log('➕ Adding new booking row:', [sessionId, sessionName, capacity, names]);
      bookingsSheet.appendRow([sessionId, sessionName, capacity, names]);
    }
    
    console.log('✅ Booking processed successfully');
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, timestamp: new Date() }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('❌ Error processing booking:', error);
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString(),
        timestamp: new Date()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSessionInfo(spreadsheet, sessionId) {
  try {
    // Get the main schedule sheet (first sheet)
    const mainSheet = spreadsheet.getSheets()[0];
    const dataRange = mainSheet.getDataRange();
    const values = dataRange.getValues();
    
    console.log('📊 Looking for session:', sessionId);
    console.log('📊 Sheet has', values.length, 'rows');
    
    // Find the session by ID and get its capacity from the main sheet
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      console.log('🔍 Checking row', i, ':', row[0], '(looking for:', sessionId + ')');
      
      if (row[0] === sessionId) { // Session ID in first column
        const sessionName = row[1] || 'Unknown Session'; // Session name in second column
        
        console.log('✅ Found session:', sessionName);
        
        // Look for capacity in the row - check all columns for capacity patterns
        let capacity = 18; // Default for Aerial Yoga
        for (let col = 0; col < row.length; col++) {
          const cellValue = String(row[col] || '').toLowerCase();
          
          // Check for explicit capacity column or patterns
          if (cellValue.includes('capacity:') || cellValue.includes('capacity ')) {
            const match = cellValue.match(/capacity[:\s]+(\d+)/);
            if (match) {
              capacity = parseInt(match[1], 10);
              console.log('📊 Found capacity in column', col, ':', capacity);
              break;
            }
          }
          // Check for patterns like "18 hammocks", "12 spots", etc.
          if (cellValue.includes('hammock') || cellValue.includes('spot')) {
            const match = cellValue.match(/(\d+)\s*(hammock|spot)/);
            if (match) {
              capacity = parseInt(match[1], 10);
              console.log('📊 Found capacity pattern in column', col, ':', capacity);
              break;
            }
          }
          // Check if this is just a number that could be capacity
          if (col > 2 && !isNaN(cellValue) && parseInt(cellValue) > 0 && parseInt(cellValue) <= 50) {
            capacity = parseInt(cellValue);
            console.log('📊 Using number in column', col, 'as capacity:', capacity);
            break;
          }
        }
        
        console.log('📊 Final session info:', { sessionName, capacity });
        return { sessionName, capacity };
      }
    }
    
    console.log('❌ Session not found:', sessionId);
    return {
      sessionName: 'Unknown Session',
      capacity: 18
    };
  } catch (error) {
    console.error('❌ Error finding session info:', error);
    return {
      sessionName: 'Unknown Session',
      capacity: 18
    };
  }
}

// Test function with explicit authorization (for debugging)
function testWebhook() {
  console.log('🧪 Starting webhook test...');
  
  try {
    // First, test if we can access SpreadsheetApp at all
    console.log('🔐 Testing SpreadsheetApp access...');
    const app = SpreadsheetApp;
    console.log('✅ SpreadsheetApp accessible');
    
    // Test data
    const sessionId = 'thu-0700-aerial-yoga';
    const names = 'Test Person 1, Test Person 2';
    const count = 2;
    
    console.log('🧪 Test data:', { sessionId, names, count });
    
    // Try to open the spreadsheet
    const SPREADSHEET_ID = '11-6l7HgRwZzFrQ22Ny8_d-wvimahJdBcceuy9OBEMAM';
    console.log('📊 Attempting to open spreadsheet:', SPREADSHEET_ID);
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log('✅ Spreadsheet opened successfully');
    
    // Test basic spreadsheet operations
    const sheets = spreadsheet.getSheets();
    console.log('📄 Found', sheets.length, 'sheets in spreadsheet');
    
    // Test finding session info
    const { sessionName, capacity } = getSessionInfo(spreadsheet, sessionId);
    console.log('📝 Session info found:', { sessionName, capacity });
    
    // Get or create Bookings tab
    let bookingsSheet = spreadsheet.getSheetByName('Bookings');
    if (!bookingsSheet) {
      console.log('📊 Creating new Bookings tab');
      bookingsSheet = spreadsheet.insertSheet('Bookings');
      bookingsSheet.getRange(1, 1, 1, 4).setValues([
        ['Session ID', 'Session Name', 'Capacity', 'Booked Names']
      ]);
    } else {
      console.log('📊 Found existing Bookings tab');
    }
    
    // Add test booking
    console.log('➕ Adding test booking row:', [sessionId, sessionName, capacity, names]);
    bookingsSheet.appendRow([sessionId, sessionName, capacity, names]);
    
    console.log('✅ Test completed successfully! Check your Bookings tab.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error details:', JSON.stringify(error));
  }
}

// Debug function to find your spreadsheet
function findMySpreadsheets() {
  console.log('🔍 Looking for your spreadsheets...');
  
  try {
    const files = DriveApp.getFilesByType(MimeType.GOOGLE_SHEETS);
    let count = 0;
    
    while (files.hasNext() && count < 10) {
      const file = files.next();
      const name = file.getName();
      const id = file.getId();
      
      console.log(`📄 ${count + 1}. "${name}" - ID: ${id}`);
      
      // Check if this might be your MAC schedule
      if (name.toLowerCase().includes('mac') || name.toLowerCase().includes('schedule')) {
        console.log(`⭐ This might be your MAC schedule: ${name}`);
      }
      
      count++;
    }
    
    console.log(`📊 Found ${count} spreadsheets. Look for your MAC schedule above.`);
    
  } catch (error) {
    console.error('❌ Error finding spreadsheets:', error);
  }
}

// Simple permission test
function testPermissions() {
  console.log('🔐 Testing basic permissions...');
  
  try {
    // Test Drive access
    console.log('📁 Testing Drive access...');
    const files = DriveApp.getFiles();
    console.log('✅ Drive access working');
    
    // Test Spreadsheet access
    console.log('📊 Testing Spreadsheet access...');
    const sheets = SpreadsheetApp;
    console.log('✅ SpreadsheetApp accessible');
    
    console.log('🎉 All basic permissions working!');
    
  } catch (error) {
    console.error('❌ Permission test failed:', error);
  }
}

// Simple test to just create the Bookings tab
function testCreateTab() {
  console.log('🧪 Testing tab creation...');
  
  try {
    // Try opening by URL instead of ID
    const spreadsheetUrl = 'https://docs.google.com/spreadsheets/d/11-6l7HgRwZzFrQ22Ny8_d-wvimahJdBcceuy9OBEMAM/edit';
    const spreadsheet = SpreadsheetApp.openByUrl(spreadsheetUrl);
    console.log('✅ Spreadsheet opened by URL');
    
    let bookingsSheet = spreadsheet.getSheetByName('Bookings');
    if (!bookingsSheet) {
      console.log('📊 Creating Bookings tab...');
      bookingsSheet = spreadsheet.insertSheet('Bookings');
      bookingsSheet.getRange(1, 1, 1, 4).setValues([
        ['Session ID', 'Session Name', 'Capacity', 'Booked Names']
      ]);
      console.log('✅ Bookings tab created successfully!');
    } else {
      console.log('📊 Bookings tab already exists');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    // Try alternative method - list all spreadsheets you have access to
    try {
      console.log('🔍 Trying to list accessible spreadsheets...');
      const files = DriveApp.getFilesByType(MimeType.GOOGLE_SHEETS);
      let count = 0;
      while (files.hasNext() && count < 5) {
        const file = files.next();
        console.log('📄 Found spreadsheet:', file.getName(), file.getId());
        count++;
      }
    } catch (driveError) {
      console.error('❌ Drive access also failed:', driveError);
    }
  }
}