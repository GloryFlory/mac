// Google Sheets data fetcher
const SHEET_ID = '11-6l7HgRwZzFrQ22Ny8_d-wvimahJdBcceuy9OBEMAM';

export async function fetchSessionsFromGoogleSheets() {
  try {
    // Use Google Sheets CSV export (requires public access)
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
    
    console.log('🔗 Fetching from URL:', csvUrl);
    
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch Google Sheets data: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    console.log('📄 Raw response length:', csvText.length);
    console.log('📄 First 500 chars of response:', csvText.substring(0, 500));
    console.log('📄 Response content type:', response.headers.get('content-type'));
    
    // Check if the response looks like HTML (common when sheet isn't public)
    if (csvText.trim().startsWith('<')) {
      console.error('❌ Received HTML instead of CSV - sheet might not be public');
      console.error('📄 HTML content:', csvText.substring(0, 1000));
      return null;
    }
    
    // Check if it looks like valid CSV
    if (!csvText.includes(',') || csvText.length < 50) {
      console.error('❌ Response doesn\'t look like valid CSV');
      return null;
    }
    
    return parseCSVToSessions(csvText);
  } catch (error) {
    console.error('❌ Error fetching from Google Sheets:', error);
    // Fallback to local JSON file
    return null;
  }
}

function parseCSVToSessions(csvText) {
  try {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    // Debug: log headers to see what we're getting from Google Sheets
    console.log('📊 CSV Headers from Google Sheets:', headers);
    
    const sessions = [];
    
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Debug: log problematic lines around 73-75
    if (i >= 72 && i <= 76) {
      console.log(`🔍 Line ${i} content:`, JSON.stringify(line));
    }
    
    try {
      // Parse CSV line (handle quoted fields)
      const values = parseCSVLine(line);
      
      // Debug: log parsed values for problematic lines
      if (i >= 72 && i <= 76) {
        console.log(`🔍 Line ${i} parsed values (${values.length}):`, values);
      }
      
      // Pad values array to match headers length if needed
      while (values.length < headers.length) {
        values.push('');
      }
      
      // Skip lines that don't have a proper ID (likely continuation of previous line)
      if (!values[0] || values[0].startsWith(',') || values[0].startsWith('"')) {
        console.log(`⚠️ Skipping line ${i}: appears to be continuation of previous line`);
        continue;
      }
      
      const session = {};
        headers.forEach((header, index) => {
          const value = values[index] || '';
          
          // Debug: log header processing for first few sessions
          if (i <= 3) {
            console.log(`🔍 Row ${i}, Header: "${header}" (${header.toLowerCase()}) = "${value}"`);
          }
          
          switch (header.toLowerCase()) {
        case 'id':
          session.id = value;
          break;
        case 'day':
          session.day = value.trim(); // Trim whitespace
          break;
        case 'start':
          session.start = value.trim();
          break;
        case 'end':
          session.end = value.trim();
          break;
        case 'title':
          session.title = value.trim(); // Trim whitespace
          break;
        case 'level':
          session.level = value;
          break;
        case 'types':
          // Convert comma-separated string to array and add to both styles and cardType
          const typesArray = value ? value.split(',').map(s => s.trim()) : [];
          session.styles = typesArray;
          
          // Determine card type based on the types
          if (typesArray.some(type => type.toLowerCase().includes('meal'))) {
            session.cardType = 'simplified';
          } else if (typesArray.some(type => type.toLowerCase().includes('special') || type.toLowerCase().includes('photo-only'))) {
            session.cardType = 'photo-only';
          } else if (typesArray.some(type => type.toLowerCase().includes('jam') || type.toLowerCase().includes('pool') || type.toLowerCase().includes('demo'))) {
            session.cardType = 'simplified';
          } else {
            session.cardType = 'full'; // Default to full workshop card
          }
          break;
        case 'teachers':
          // Convert comma-separated string to array
          session.teachers = value ? value.split(',').map(t => t.trim()) : [];
          break;
        case 'location':
          session.location = value;
          break;
        case 'description':
          session.description = value;
          break;
        case 'pre-requesites':
        case 'prerequisites':
          session.prereqs = value;
          break;
        case 'type':
        case 'cardtype':
        case 'card-type':
        case 'card type':
          // Direct card type specification from sheet - normalize the value
          const normalizedCardType = value.toLowerCase().trim().replace(/\s+/g, '-');
          session.cardType = normalizedCardType;
          break;
        default:
          // Handle any additional columns
          session[header] = value;
      }
    });
    
        // Add default tags based on session type
        session.tags = generateTags(session);
        
        // Debug: log session cardType for yoga sessions
        if (session.title && (session.title.toLowerCase().includes('yoga') || session.title.toLowerCase().includes('therapeutics'))) {
          console.log(`📝 YOGA/THERAPEUTICS: "${session.title}" - CardType: "${session.cardType}"`);
        } else {
          console.log(`📝 Session "${session.title}" - CardType: "${session.cardType}"`);
        }
        
        sessions.push(session);
      } catch (lineError) {
        console.error(`❌ Error parsing line ${i}:`, lineError, 'Line content:', line);
      }
    }
    
    // Debug logging to see what we got from Google Sheets
    console.log('📊 Google Sheets sessions loaded:', sessions.length);
    console.log('📅 Days found:', [...new Set(sessions.map(s => s.day))]);
    
    return sessions;
  } catch (error) {
    console.error('❌ Error parsing CSV:', error);
    return [];
  }
}

function parseCSVLine(line) {
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
}

function generateTags(session) {
  const tags = [];
  
  // Add time-based tags
  const hour = parseInt(session.start?.split(':')[0] || '12');
  if (hour < 9) tags.push('morning');
  else if (hour < 17) tags.push('afternoon');
  else tags.push('evening');
  
  // Add location-based tags
  if (session.location?.toLowerCase().includes('beach')) tags.push('beach');
  if (session.location?.toLowerCase().includes('pool')) tags.push('pool');
  if (session.location?.toLowerCase().includes('garden')) tags.push('garden');
  
  // Add meal tags
  if (session.title?.toLowerCase().includes('breakfast')) tags.push('meal');
  if (session.title?.toLowerCase().includes('lunch')) tags.push('meal');
  if (session.title?.toLowerCase().includes('dinner')) tags.push('meal');
  
  // Add special tags
  if (session.title?.toLowerCase().includes('demo')) tags.push('demo');
  if (session.title?.toLowerCase().includes('jam')) tags.push('free-time');
  if (session.title?.toLowerCase().includes('pool')) tags.push('free-time', 'pool');
  
  return tags;
}