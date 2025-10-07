// Session booking utility for capacity-limited sessions with Google Sheets integration
// Similar to photoshoot bookings but for session capacity management

const MAIN_SHEET_ID = '11-6l7HgRwZzFrQ22Ny8_d-wvimahJdBcceuy9OBEMAM';
const BOOKINGS_TAB_NAME = 'Bookings';

// Google Sheets URLs
const BOOKINGS_CSV_URL = `https://docs.google.com/spreadsheets/d/${MAIN_SHEET_ID}/export?format=csv&gid=1204648100`;
const GOOGLE_APPS_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEBHOOK_URL'; // To be configured

// Generate a unique device ID for this browser/device
function getDeviceId() {
  let deviceId = localStorage.getItem('mac-device-id');
  if (!deviceId) {
    deviceId = 'device-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
    localStorage.setItem('mac-device-id', deviceId);
  }
  return deviceId;
}

// Check if a session has capacity booking enabled
export function hasCapacityBooking(session) {
  return session && session.capacity && session.capacity > 0;
}

// Merge sessions with booking data from Google Sheets
export async function mergeSessionsWithBookings(sessions) {
  try {
    const bookingsData = await fetchSessionBookingsFromGoogleSheets();
    if (!bookingsData) {
      console.log('📄 No booking data found, sessions remain unlimited');
      return sessions;
    }
    
    // Add capacity information to sessions
    const mergedSessions = sessions.map(session => {
      const bookingInfo = bookingsData[session.id];
      if (bookingInfo) {
        return {
          ...session,
          capacity: bookingInfo.capacity,
          bookedNames: bookingInfo.bookedNames,
          bookingCount: bookingInfo.bookingCount
        };
      }
      return session;
    });
    
    console.log('✅ Merged sessions with booking data');
    return mergedSessions;
  } catch (error) {
    console.error('❌ Error merging sessions with bookings:', error);
    console.log('📄 Continuing with unlimited sessions');
    return sessions; // Return original sessions if merge fails
  }
}

// Fetch session bookings from Google Sheets (disabled for now - using localStorage)
export const fetchSessionBookingsFromGoogleSheets = async () => {
  try {
    console.log('📊 Google Sheets reading disabled - using localStorage only');
    console.log('� (Writes to Google Sheets still work via webhook)');
    return null; // This forces the system to use localStorage for reading
  } catch (error) {
    console.error('❌ Error fetching session bookings from Google Sheets:', error);
    return null;
  }
};

// Parse CSV data into session bookings object
const parseSessionBookingsCSV = (csvData) => {
  try {
    const lines = csvData.trim().split('\n');
    
    if (lines.length < 2) {
      console.log('📊 Empty session bookings sheet');
      return {};
    }
    
    // Skip header row
    const dataLines = lines.slice(1);
    const bookings = {};
    
    dataLines.forEach((line, index) => {
      try {
        const values = parseCSVLine(line);
        
        if (values.length >= 4) {
          const sessionId = values[0]?.trim();
          const sessionName = values[1]?.trim();
          const capacity = parseInt(values[2]?.trim(), 10);
          const bookedNames = values[3]?.trim();
          
          if (sessionId && !isNaN(capacity) && capacity > 0) {
            const names = bookedNames ? bookedNames.split(',').map(name => name.trim()).filter(name => name) : [];
            
            bookings[sessionId] = {
              sessionName,
              capacity,
              bookedNames: names,
              bookingCount: names.length
            };
          }
        }
      } catch (lineError) {
        console.warn(`⚠️ Error parsing booking line ${index + 2}:`, lineError);
      }
    });
    
    console.log('✅ Parsed session bookings from Google Sheets:', Object.keys(bookings).length, 'sessions with bookings');
    return bookings;
  } catch (error) {
    console.error('❌ Error parsing session bookings CSV:', error);
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
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values.map(v => v.replace(/^"|"$/g, ''));
};

// Get booking count for a session (count actual people, not just devices)
export function getBookingCount(sessionId, googleSheetsBookings = null) {
  if (googleSheetsBookings && googleSheetsBookings[sessionId]) {
    return googleSheetsBookings[sessionId].bookingCount;
  }
  
  // Count from localStorage - sum up all people from all devices
  try {
    const localBookings = JSON.parse(localStorage.getItem('mac-session-bookings') || '{}');
    const sessionBookings = localBookings[sessionId] || {};
    
    let totalCount = 0;
    Object.values(sessionBookings).forEach(booking => {
      totalCount += booking.count || 1; // Fallback to 1 for old bookings without count
    });
    
    return totalCount;
  } catch (error) {
    console.error('Error getting booking count:', error);
    return 0;
  }
}

// Check if current user has booked this session
export function isUserBooked(sessionId, googleSheetsBookings = null) {
  // Always check localStorage for user's own bookings
  try {
    const deviceId = getDeviceId();
    const localBookings = JSON.parse(localStorage.getItem('mac-session-bookings') || '{}');
    const sessionBookings = localBookings[sessionId] || {};
    return deviceId in sessionBookings;
  } catch (error) {
    console.error('Error checking user booking status:', error);
    return false;
  }
}

// Toggle booking for a session with names
export function toggleBooking(sessionId, names = []) {
  try {
    const deviceId = getDeviceId();
    const localBookings = JSON.parse(localStorage.getItem('mac-session-bookings') || '{}');
    
    if (!localBookings[sessionId]) {
      localBookings[sessionId] = {};
    }
    
    const sessionBookings = localBookings[sessionId];
    const wasBooked = deviceId in sessionBookings;
    
    if (wasBooked) {
      // Remove booking
      delete sessionBookings[deviceId];
      console.log(`📋 Removed booking for session: ${sessionId}`);
    } else {
      // Add booking with names and count
      sessionBookings[deviceId] = {
        timestamp: Date.now(),
        deviceId: deviceId,
        names: names,
        count: names.length
      };
      console.log(`📋 Added booking for session: ${sessionId} - ${names.length} people: ${names.join(', ')}`);
    }
    
    // Clean up empty session objects
    if (Object.keys(sessionBookings).length === 0) {
      delete localBookings[sessionId];
    }
    
    localStorage.setItem('mac-session-bookings', JSON.stringify(localBookings));
    
    // Sync to Google Sheets
    syncSessionBookingToGoogleSheets(sessionId, localBookings[sessionId] || {});
    
    return !wasBooked; // Return new booking status
  } catch (error) {
    console.error('Error toggling booking:', error);
    return false;
  }
}

// Check if session is full
export function isSessionFull(session, googleSheetsBookings = null) {
  if (!hasCapacityBooking(session)) {
    return false;
  }
  
  const bookingCount = getBookingCount(session.id, googleSheetsBookings);
  return bookingCount >= session.capacity;
}

// Get booking status for display
export function getBookingStatus(session, googleSheetsBookings = null) {
  if (!hasCapacityBooking(session)) {
    return null;
  }
  
  const bookingCount = getBookingCount(session.id, googleSheetsBookings);
  const capacity = session.capacity;
  const isFull = bookingCount >= capacity;
  const isBooked = isUserBooked(session.id, googleSheetsBookings);
  
  return {
    bookingCount,
    capacity,
    isFull,
    isBooked,
    spotsLeft: capacity - bookingCount
  };
}

// Debug function to see all bookings
export function getAllBookings() {
  try {
    return JSON.parse(localStorage.getItem('mac-session-bookings') || '{}');
  } catch (error) {
    console.error('Error getting all bookings:', error);
    return {};
  }
}

// Sync a single session booking to Google Sheets
const syncSessionBookingToGoogleSheets = async (sessionId, sessionBookings) => {
  try {
    // Collect all names from all devices for this session
    const allNames = [];
    Object.values(sessionBookings).forEach(booking => {
      if (booking.names && Array.isArray(booking.names)) {
        allNames.push(...booking.names);
      }
    });
    
    // Call Google Apps Script webhook to update the "Bookings" tab
    const bookingData = {
      sessionId,
      names: allNames.join(', '),
      count: allNames.length,
      timestamp: new Date().toISOString()
    };
    
    console.log(`📊 Attempting to sync to Google Sheets:`, bookingData);
    
    // Google Apps Script webhook URL for syncing to "Bookings" tab
    const webhookUrl = 'https://script.google.com/macros/s/AKfycbyoYd6i4X9WEu05qdqEapwFEdgUcu9DvIIdcSveYG_QyqUfJzxatxMCpiR6sBrb0g/exec';
    
    try {
      console.log(`🔗 Calling webhook: ${webhookUrl}`);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
        mode: 'no-cors' // Google Apps Script requires this
      });
      
      console.log('✅ Webhook call completed (no-cors mode - response not readable)');
      console.log('📝 Synced data:', bookingData);
      return true;
    } catch (fetchError) {
      console.error('❌ Webhook call failed:', fetchError);
      console.warn('⚠️ Google Sheets sync failed, saved locally:', fetchError.message);
      console.log(`📝 Booking data: ${bookingData.count} people - ${bookingData.names}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error syncing to Google Sheets:', error);
    return false;
  }
};