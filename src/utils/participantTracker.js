// Simple participant tracker for special sessions (like Cacao Ceremony)
// Local storage only - perfect for preparation planning

const STORAGE_KEY = 'mac_participants';

// Get all participants for all sessions
export function getAllParticipants() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading participants:', error);
    return {};
  }
}

// Get participants for a specific session
export function getSessionParticipants(sessionTitle) {
  const allParticipants = getAllParticipants();
  return allParticipants[sessionTitle] || [];
}

// Get participant count for a session
export function getParticipantCount(sessionTitle) {
  return getSessionParticipants(sessionTitle).length;
}

// Check if current user is participating in a session
export function isUserParticipating(sessionTitle) {
  const participants = getSessionParticipants(sessionTitle);
  const deviceId = getDeviceId();
  return participants.includes(deviceId);
}

// Add current user to session participants
export function joinSession(sessionTitle) {
  const allParticipants = getAllParticipants();
  const deviceId = getDeviceId();
  
  if (!allParticipants[sessionTitle]) {
    allParticipants[sessionTitle] = [];
  }
  
  // Add user if not already participating
  if (!allParticipants[sessionTitle].includes(deviceId)) {
    allParticipants[sessionTitle].push(deviceId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allParticipants));
    return true;
  }
  
  return false; // Already participating
}

// Remove current user from session participants
export function leaveSession(sessionTitle) {
  const allParticipants = getAllParticipants();
  const deviceId = getDeviceId();
  
  if (allParticipants[sessionTitle]) {
    allParticipants[sessionTitle] = allParticipants[sessionTitle].filter(
      id => id !== deviceId
    );
    
    // Clean up empty arrays
    if (allParticipants[sessionTitle].length === 0) {
      delete allParticipants[sessionTitle];
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allParticipants));
    return true;
  }
  
  return false; // Wasn't participating
}

// Toggle participation for current user
export function toggleParticipation(sessionTitle) {
  if (isUserParticipating(sessionTitle)) {
    leaveSession(sessionTitle);
    return false; // Now not participating
  } else {
    joinSession(sessionTitle);
    return true; // Now participating
  }
}

// Generate a simple device ID for tracking
function getDeviceId() {
  let deviceId = localStorage.getItem('mac_device_id');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('mac_device_id', deviceId);
  }
  return deviceId;
}

// Check if a session has participant tracking enabled
export function hasParticipantTracking(sessionTitle) {
  if (!sessionTitle) return false;
  
  const title = sessionTitle.toLowerCase();
  
  // Check for cacao ceremony variations
  const hasTracking = title.includes('cacao') || title.includes('ceremony');
  
  // Debug logging
  if (hasTracking) {
    console.log('🌱 Participant tracking enabled for:', sessionTitle);
  }
  
  return hasTracking;
}