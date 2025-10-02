// Google Sheets integration for photoshoot bookings
// Two-way sync between app and Google Sheets

const GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/1q2QLJglIrHWZ-6TzanK7UMWZfsluYc5xfwu-fYwY6ss/export?format=csv&gid=0';

// Google Apps Script webhook URL for writing data
// You'll need to set this up for two-way sync
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx5YUw-IGHKrPn2nHb0L4lqxC-7ou5BZTQKfsBO-7XsD4CjWUAVlVPmKSF0tjxWu7RddA/exec';

// Function to fetch bookings from Google Sheets
export const fetchBookingsFromGoogleSheets = async () => {
  try {
    console.log('📊 Fetching photoshoot bookings from Google Sheets...');
    const response = await fetch(GOOGLE_SHEETS_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvData = await response.text();
    return parseBookingsCSV(csvData);
  } catch (error) {
    console.error('❌ Error fetching bookings from Google Sheets:', error);
    return null;
  }
};

// Function to parse CSV data into bookings object
const parseBookingsCSV = (csvData) => {
  try {
    const lines = csvData.trim().split('\n');
    
    if (lines.length < 2) {
      console.log('📊 Empty bookings sheet');
      return {};
    }
    
    // Skip header row
    const dataLines = lines.slice(1);
    const bookings = {};
    
    dataLines.forEach((line, index) => {
      try {
        // Parse CSV line (handle commas in quoted fields)
        const values = parseCSVLine(line);
        
        if (values.length >= 2) {
          const timeSlot = values[0]?.trim();
          const namesString = values[1]?.trim();
          
          if (timeSlot && namesString) {
            // Split names by comma and clean them
            const names = namesString.split(',').map(name => name.trim()).filter(name => name);
            if (names.length > 0) {
              bookings[timeSlot] = names;
            }
          }
        }
      } catch (lineError) {
        console.warn(`⚠️ Error parsing booking line ${index + 2}:`, lineError);
      }
    });
    
    console.log('✅ Parsed bookings from Google Sheets:', Object.keys(bookings).length, 'slots booked');
    return bookings;
  } catch (error) {
    console.error('❌ Error parsing bookings CSV:', error);
    return {};
  }
};

// Helper function to parse CSV line with proper comma handling
const parseCSVLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current);
  return values;
};

// Function to sync local bookings to Google Sheets (write operation)
export const syncBookingsToGoogleSheets = async (bookings) => {
  try {
    console.log('📊 Syncing bookings to Google Sheets...');
    console.log('🔗 Google Apps Script URL:', GOOGLE_APPS_SCRIPT_URL);
    
    // Convert bookings object to the format expected by Google Apps Script
    const bookingData = Object.entries(bookings).map(([timeSlot, names]) => ({
      timeSlot,
      names: names.join(', ')
    }));
    
    console.log('📝 Booking data to sync:', bookingData);
    
    // If Google Apps Script webhook is configured, send data
    if (GOOGLE_APPS_SCRIPT_URL && GOOGLE_APPS_SCRIPT_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_WEBHOOK_URL') {
      console.log('✅ URL is configured, attempting to sync...');
      
      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookings: bookingData }),
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response type:', response.type);
      
      // With no-cors mode, we can't read the response content
      // but if the request doesn't throw an error, it likely succeeded
      if (response.type === 'opaque') {
        console.log('✅ Request sent successfully (opaque response due to CORS)');
        console.log('📊 Bookings synced to Google Sheets successfully!');
        return true;
      } else if (response.ok) {
        const result = await response.text();
        console.log('✅ Successfully synced to Google Sheets:', result);
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to sync to Google Sheets:', response.status, errorText);
        return false;
      }
    } else {
      console.log('⚠️ Google Apps Script URL not configured or is placeholder');
      console.log('🔍 Current URL:', GOOGLE_APPS_SCRIPT_URL);
      console.log('🔍 URL check result:', GOOGLE_APPS_SCRIPT_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_WEBHOOK_URL');
      return false;
    }
  } catch (error) {
    console.error('❌ Error syncing to Google Sheets:', error);
    return false;
  }
};

// Generate CSV format for bookings
const generateBookingsCSV = (bookings) => {
  let csvContent = 'Time Slot,Names\n';
  
  Object.entries(bookings).forEach(([timeSlot, names]) => {
    const namesString = names.join(', ');
    csvContent += `"${timeSlot}","${namesString}"\n`;
  });
  
  return csvContent;
};

// Function to generate all possible time slots for Google Sheets template
export const generateTimeSlotsCSV = () => {
  const slots = [];
  const startTime = 14 * 60; // 14:00 (2PM) in minutes
  
  for (let i = 0; i < 40; i++) {
    const timeInMinutes = startTime + (i * 3);
    const hours = Math.floor(timeInMinutes / 60);
    const minutes = timeInMinutes % 60;
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    slots.push(timeStr);
  }
  
  let csvContent = 'Time Slot,Names\n';
  slots.forEach(slot => {
    csvContent += `"${slot}",""\n`;
  });
  
  return csvContent;
};

// Setup instructions for admin
export const getSetupInstructions = () => {
  return `
📊 Google Sheets Setup Instructions for Photoshoot Bookings:

1. Create a new Google Sheet
2. Add these column headers in row 1:
   - A1: "Time Slot"
   - B1: "Names"

3. Add all time slots from 14:00 to 15:57 (3-minute intervals):
   ${generateTimeSlotsCSV()}

4. Make the sheet publicly viewable:
   - File → Share → "Anyone with the link can view"

5. Get the share link and extract:
   - Sheet ID (between /d/ and /edit)
   - Sheet GID (gid= parameter, usually 0 for first sheet)

6. Update the GOOGLE_SHEETS_URL in photoshootBookings.js with your sheet details

7. To manage bookings as admin:
   - Edit the "Names" column directly in Google Sheets
   - Use format: "Name 1, Name 2" for multiple people
   - Leave empty for available slots
   - Changes will sync to the app automatically

Note: For two-way sync (app updates to Google Sheets), you'll need to set up a Google Apps Script webhook.
`;
};