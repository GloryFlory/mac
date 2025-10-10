    // MAC 2025 Photoshoot Booking Sync
    // Auto-configured for your Google Sheet
    const SHEET_ID = '1q2QLJglIrHWZ-6TzanK7UMWZfsluYc5xfwu-fYwY6ss';

    function doPost(e) {
    try {
        console.log('📊 Received booking sync request');
        const data = JSON.parse(e.postData.contents);
        const bookings = data.bookings || [];
        
        const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Sheet1');
        
        // Clear existing data except headers  
        if (sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).clearContent();
        console.log('🧹 Cleared existing data');
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
        
        // Write all data at once (efficient batch operation)
        if (dataToWrite.length > 0) {
        sheet.getRange(2, 1, dataToWrite.length, 2).setValues(dataToWrite);
        console.log(`✅ Updated ${bookings.length} bookings in Google Sheets`);
        }
        
        return ContentService.createTextOutput(JSON.stringify({
        success: true,
        updated: bookings.length,
        timestamp: new Date().toISOString(),
        message: 'Bookings synced successfully'
        })).setMimeType(ContentService.MimeType.JSON);
        
    } catch (error) {
        console.error('❌ Error syncing bookings:', error);
        return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        timestamp: new Date().toISOString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
    }

    function doGet(e) {
    // Handle GET requests for testing
    return ContentService.createTextOutput(JSON.stringify({
        message: 'MAC 2025 Photoshoot Booking Webhook',
        status: 'Active',
        sheetId: SHEET_ID,
        timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
    }

    // Test function - run this to verify the script works
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