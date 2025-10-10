'use client';
import React, { useState, useMemo, useEffect, Fragment } from 'react';
import sessionsData from '../data/sessions.json';
import { fetchSessionsFromGoogleSheets } from '../utils/googleSheets';
import { fetchBookingsFromGoogleSheets, syncBookingsToGoogleSheets } from '../utils/photoshootBookings';
import { hasParticipantTracking, getParticipantCount, isUserParticipating, toggleParticipation } from '../utils/participantTracker';
import { hasCapacityBooking, getBookingCount, isUserBooked, toggleBooking, isSessionFull, getBookingStatus, mergeSessionsWithBookings, getAllBookings, clearAllLocalBookings, debugSetBooking } from '../utils/sessionBookings';

// Helper function to try different image extensions
const getTeacherImageSrc = (teachers) => {
  const teacherKey = teachers.join(' and ').toLowerCase();
  
  // Special mappings for individual sessions with correct extensions
  const specialMappings = {
    'mads': 'mads.png',
    'flo': 'flo-mac.jpeg',
    'maria': 'maria.jpg',
    'daria': 'daria.png',
    'svetlana': 'svetlana.jpg',
    'andre': 'andre.jpg' // Andre now has his individual photo
  };
  
  // Check if this is a single teacher with a special mapping
  if (teachers.length === 1) {
    const teacherName = teachers[0].toLowerCase();
    if (specialMappings[teacherName]) {
      return `/teachers/${specialMappings[teacherName]}`;
    }
  }
  
  // Special cases for teacher pairs with specific extensions
  if (teacherKey === 'ammanda and paulo') {
    return `/teachers/ammanda-paulo.png`;
  }
  
  if (teacherKey === 'mads and maria and flo') {
    return `/teachers/mads-maria-flo.png`;
  }
  
  // Default behavior for teacher pairs or unmapped teachers
  const baseName = teachers.join('-').toLowerCase().replace(/\s+/g, '-');
  return `/teachers/${baseName}.jpg`;
};

// Helper function to get teacher website links
const getTeacherLink = (teachers) => {
  const teacherKey = teachers.join(' and ').toLowerCase();
  
  const teacherLinks = {
    'caspian and laura': 'https://www.acrointhesun.com/acrospirit-bio',
    'coni and mati': 'https://www.acrointhesun.com/acroconciencia-bio',
    'maria and flo': 'https://www.acrointhesun.com/mariaandflo-bio-1',
    'ammanda and paulo': 'https://www.acrointhesun.com/sunshineacro-bio-1',
    'marysia and julian': 'https://www.acrointhesun.com/marysiajulian-bio-1',
    'andre and daria': 'https://www.acrointhesun.com/andreanddaria',
    'lloydie and flo': 'https://www.acrointhesun.com/double-up-acro',
    'mads': 'https://www.acrointhesun.com/mads'
  };
  
  return teacherLinks[teacherKey] || '#';
};

// Helper function to calculate duration in minutes
const getDuration = (start, end) => {
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  return (endHour * 60 + endMin) - (startHour * 60 + startMin);
};

// Helper function to get session visual size based on duration
const getSessionSize = (session) => {
  const duration = getDuration(session.start, session.end);
  if (duration <= 30) return 'small';  // 15-30 min sessions (demos, breaks)
  if (duration <= 90) return 'medium'; // 60-90 min workshops
  return 'large'; // 2+ hour sessions
};

// Helper function to get time period for better grouping
const getTimePeriod = (timeString) => {
  const hour = parseInt(timeString.split(':')[0]);
  if (hour < 9) return 'Early Morning';
  if (hour < 12) return 'Morning';
  if (hour < 14) return 'Lunch Time';
  if (hour < 17) return 'Afternoon';
  if (hour < 20) return 'Evening';
  return 'Night';
};

// Helper function to get session type for styling
const getSessionType = (session) => {
  const title = session.title.toLowerCase();
  if (title.includes('breakfast') || title.includes('lunch') || title.includes('dinner')) {
    return 'meal';
  }
  if (title.includes('demo') || title.includes('warm up')) {
    return 'demo';
  }
  if (title.includes('registration') || title.includes('arrival')) {
    return 'registration';
  }
  if (title.includes('pool') || title.includes('relax') || title.includes('jam')) {
    return 'break';
  }
  if (title.includes('yoga') || title.includes('healing') || title.includes('massage') || title.includes('cacao') || title.includes('therapeutics')) {
    return 'wellness';
  }
  return 'workshop';
};

// Helper function to group sessions by time slots for better structure
const groupByTimeSlots = (sessions) => {
  const timeSlots = {};
  
  sessions.forEach(session => {
    const hour = session.start.split(':')[0];
    const timeSlot = `${hour}:00`;
    
    if (!timeSlots[timeSlot]) {
      timeSlots[timeSlot] = [];
    }
    timeSlots[timeSlot].push(session);
  });
  
  return timeSlots;
};

// Helper function to format time
const formatTime = (timeString) => {
  return timeString;
};

// Helper function to create time range string
const timeRange = (start, end) => {
  return `${formatTime(start)} - ${formatTime(end)}`;
};

// Helper function to group sessions by day
const groupByDay = (sessions) => {
  return sessions.reduce((groups, session) => {
    const day = session.day;
    if (!groups[day]) {
      groups[day] = [];
    }
    groups[day].push(session);
    return groups;
  }, {});
};

// Helper function to get level badge color
const getLevelColor = (level) => {
  switch (level) {
    case 'Beginner':
      return 'var(--success-green)';
    case 'Intermediate':
      return 'var(--warning-amber)';
    case 'Advanced':
      return 'var(--coral-energy)';
    default:
      return 'var(--primary-blue)';
  }
};

// Helper function to sort days in chronological order
const sortDays = (days) => {
  const dayOrder = ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
};

  // SessionCard component with compact layout and workshop highlighting
  const SessionCard = ({ session, onClick, onStyleClick, setShowPhotoshootBooking }) => {
    const size = getSessionSize(session);
    
    // Use cardType from Google Sheets data, with fallback to old logic
    let cardType = session.cardType || 'full';
    
    // Determine if this is a workshop (Full or Photo-only)
    const isWorkshop = cardType === 'full' || cardType === 'photo-only';
    const workshopClass = isWorkshop ? 'workshop-highlight' : 'non-workshop';
  
  // Fallback logic for local JSON data (backward compatibility)
  if (!session.cardType) {
    const isMeal = session.title === 'Breakfast' || session.title === 'Lunch' || session.title === 'Dinner';
    const isDemo = session.title.includes('Demo') || session.title.includes('Warm Up');
    
    const simplifiedSessions = [
      'Arrival & Registration',
      'Opening Circle and Ice breaker games',
      'Dinner & Break',
      'Acro Speed Dating',
      'Jam',
      'Registration',
      'Pool/Relax/Jam'
    ];
    
    const photoOnlySessions = [
      'Yoga with Daria',
      'Yoga with Maria',
      'Aerial Yoga with Svetlana',
      'Sound Healing with Mads',
      'Thai Massage with Flo',
      'Cacao Ceremony with Daria',
      'Therapeutics with Andre'
    ];
    
    if (isMeal || isDemo || simplifiedSessions.includes(session.title)) {
      cardType = 'simplified';
    } else if (photoOnlySessions.includes(session.title)) {
      cardType = 'photo-only';
    }
  }
  
  const isSimplified = cardType === 'simplified';
  const isPhotoOnly = cardType === 'photo-only' || cardType === 'photo only';
  
  // Simplified card for meals, demos, and special sessions
  if (isSimplified) {
    const isPhotoshoot = session.title.toLowerCase().includes('photoshoot') || session.title.toLowerCase().includes('photo shoot');
    
    return (
      <div className={`session-card session-card-${size} simple-card ${workshopClass}`} onClick={() => onClick(session)}>
        <div className="session-header">
          <h3 className="session-title session-title-fixed-height">{session.title}</h3>
          <button className="info-button" onClick={(e) => { e.stopPropagation(); onClick(session); }}>
            <span>ℹ</span>
          </button>
        </div>
        <div className="session-content">
          <div className="session-time-location">
            <span className="time">{timeRange(session.start, session.end)}</span>
            <span className="location">{session.location}</span>
          </div>
          
                    {/* Photoshoot booking hint for main card */}
          {isPhotoshoot && (
            <div className="photoshoot-booking-hint">
              <span className="booking-hint-text">Open Details to Book</span>
            </div>
          )}
          
          {/* Participant tracking hint for main card */}
          {hasParticipantTracking(session.title) && (
            <div className="participant-tracking-hint">
              <span className="participant-hint-text">🌱 Open Details to Join</span>
            </div>
          )}
          
          {/* Capacity booking hint for main card */}
          {hasCapacityBooking(session) && (
            <div className="capacity-booking-hint">
              <span className="booking-hint-text">📋 Open Details to Book Spot</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Photo-only card for special sessions (name, time, location, photo only)
  if (isPhotoOnly) {
    return (
      <div className={`session-card session-card-${size} photo-only-card ${workshopClass}`} onClick={() => onClick(session)}>
        <div className="session-header">
          <h3 className="session-title session-title-fixed-height">{session.title}</h3>
          <button className="info-button" onClick={(e) => { e.stopPropagation(); onClick(session); }}>
            <span>ℹ</span>
          </button>
        </div>
        <div className="session-content">
          <div className="session-time-location">
            <span className="time">{timeRange(session.start, session.end)}</span>
            <span className="location">{session.location}</span>
          </div>
          
          {/* Photo and Teachers inline */}
          <div className="photo-only-section">
            {session.teachers && session.teachers.length > 0 && (
              <div className="teachers-names">
                <strong>Teachers:</strong>
                <div className="teacher-links">
                  <a 
                    href={getTeacherLink(session.teachers)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="teacher-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {session.teachers.join(' and ')}
                  </a>
                </div>
              </div>
            )}
            
            {session.teachers && session.teachers.length > 0 && (
              <div className="teacher-photo-inline">
                <img 
                  src={getTeacherImageSrc(session.teachers)}
                  alt={session.teachers.join(' and ')}
                  className="teacher-photo-large"
                  onError={(e) => {
                    // Show placeholder if image fails to load
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="teacher-placeholder-large" style={{ display: 'none' }}>
                  {session.teachers.length === 1 
                    ? session.teachers[0].split(' ').map(n => n[0]).join('').toUpperCase()
                    : session.teachers.map(teacher => teacher.split(' ')[0][0]).join('').toUpperCase()
                  }
                </div>
              </div>
            )}
          </div>
          
          {/* Participant tracking hint for photo-only cards */}
          {hasParticipantTracking(session.title) && (
            <div className="participant-tracking-hint">
              <span className="participant-hint-text">🌱 Open Details to Join</span>
            </div>
          )}
          
          {/* Capacity booking hint for photo-only cards */}
          {hasCapacityBooking(session) && (
            <div className="capacity-booking-hint">
              <span className="booking-hint-text">📋 Open Details to Book Spot</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Full card for workshops with compact layout
  return (
    <div className={`session-card session-card-${size} ${workshopClass}`} onClick={() => onClick(session)}>
      {/* Line 1: Name and Info button */}
      <div className="session-header">
        <h3 className="session-title session-title-fixed-height">{session.title}</h3>
        <button className="info-button" onClick={(e) => { e.stopPropagation(); onClick(session); }}>
          <span>ℹ</span>
        </button>
      </div>
      
      <div className="session-content">
        {/* Line 2: Time and Room */}
        <div className="session-time-location">
          <span className="time">{timeRange(session.start, session.end)}</span>
          <span className="location">{session.location}</span>
        </div>
        
        {/* Line 3: Teacher name with Hyperlink */}
        {session.teachers && session.teachers.length > 0 && (
          <div className="teachers-names-compact">
            <a 
              href={getTeacherLink(session.teachers)}
              target="_blank"
              rel="noopener noreferrer"
              className="teacher-link"
              onClick={(e) => e.stopPropagation()}
            >
              {session.teachers.join(' and ')}
            </a>
          </div>
        )}
        
        {/* Line 4: Level and Type Tags */}
        <div className="level-and-tags">
          <span 
            className="level-badge level-badge-compact" 
            style={{ backgroundColor: getLevelColor(session.level) }}
          >
            {session.level}
          </span>
          <div className="styles-compact">
            {session.styles.map((style, index) => (
              <button 
                key={index} 
                className="style-tag style-tag-compact clickable"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  onStyleClick(style);
                }}
                title={`Filter by ${style}`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
        
        {/* Line 5: Prerequisites */}
        <div className="prereqs-compact">
          <strong>Pre-Reqs:</strong> {session.prereqs && session.prereqs !== "" && session.prereqs !== "TBD" ? session.prereqs : "None"}
        </div>
        
        {/* Teacher Photo - same positioning for both mobile and desktop */}
        {session.teachers && session.teachers.length > 0 && (
          <div className="teacher-photo-bottom-right">
            <img 
              src={getTeacherImageSrc(session.teachers)}
              alt={session.teachers.join(' and ')}
              className="teacher-photo-large"
              onError={(e) => {
                // Try different extensions
                const baseName = session.teachers.join('-').toLowerCase().replace(/\s+/g, '-');
                const currentSrc = e.target.src;
                
                if (currentSrc.endsWith('.jpg')) {
                  e.target.src = `/teachers/${baseName}.png`;
                } else if (currentSrc.endsWith('.png')) {
                  e.target.src = `/teachers/${baseName}.jpeg`;
                } else {
                  // All extensions failed, show placeholder
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }
              }}
            />
            <div className="teacher-placeholder-large" style={{ display: 'none' }}>
              {session.teachers.length === 1 
                ? session.teachers[0].split(' ').map(n => n[0]).join('').toUpperCase()
                : session.teachers.map(teacher => teacher.split(' ')[0][0]).join('').toUpperCase()
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SessionModal = ({ session, onClose, setShowPhotoshootBooking }) => {
  if (!session) return null;

  // Check if this is a simplified session (same logic as in SessionCard)
  const isMeal = session.title === 'Breakfast' || session.title === 'Lunch' || session.title === 'Dinner';
  const isDemo = session.title.includes('Demo') || session.title.includes('Warm Up');
  const isPhotoshoot = session.title.toLowerCase().includes('photoshoot') || session.title.toLowerCase().includes('photo shoot');
  const hasParticipants = hasParticipantTracking(session.title);
  
  // State for participant tracking
  const [participantCount, setParticipantCount] = useState(getParticipantCount(session.title));
  const [isParticipating, setIsParticipating] = useState(isUserParticipating(session.title));
  
  // State for capacity booking
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingNames, setBookingNames] = useState(['']);
  
  // State for forcing re-renders when booking status changes
  const [, forceUpdate] = useState({});
  
  const simplifiedSessions = [
    'Arrival & Registration',
    'Opening Circle and Ice breaker games',
    'Dinner & Break',
    'Acro Speed Dating',
    'Jam',
    'Registration'
  ];
  
  const photoOnlySessions = [
    'Yoga with Daria',
    'Aerial Yoga with Svetlana',
    'Sound Healing with Mads',
    'Thai Massage with Flo',
    'Cacao Ceremony with Daria',
    'Therapeutics with Andre'
  ];
  
  const isSimplified = isMeal || isDemo || simplifiedSessions.includes(session.title);
  const isPhotoOnly = photoOnlySessions.includes(session.title);

  // Get teacher bio link (single link for all teachers)
  const teacherBioLink = session.teachers && session.teachers.length > 0 ? getTeacherLink(session.teachers) : '#';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-section">
            <h2>{session.title}</h2>
            <div className="modal-quick-info">
              <span className="modal-time">{timeRange(session.start, session.end)}</span>
              <span className="modal-day">{session.day}</span>
              <span className="modal-location">{session.location}</span>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        {/* Teacher Photo Section - Full Width under header */}
        {session.teachers && session.teachers.length > 0 && (
          <div className="modal-teacher-section">
            <div className="modal-teacher-photo">
              <img 
                src={getTeacherImageSrc(session.teachers)}
                alt={`${session.teachers.join(' and ')}`}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="modal-teacher-initials" style={{ display: 'none' }}>
                {session.teachers.map(teacher => teacher.split(' ').map(n => n[0]).join('')).join(' & ')}
              </div>
            </div>
            <div className="modal-teacher-info">
              <h3 className="modal-teacher-names">{session.teachers.join(' & ')}</h3>
              {teacherBioLink !== '#' && (
                <a href={teacherBioLink} target="_blank" rel="noopener noreferrer" className="modal-teacher-link">
                  View Teacher Bio →
                </a>
              )}
            </div>
          </div>
        )}
        
        <div className="modal-body">
          <div className="session-details">
            
            {/* Photoshoot Booking Section */}
            {isPhotoshoot && (
              <div className="photoshoot-booking-section">
                <h4>📸 Book Your Photo Session</h4>
                <p className="photoshoot-description">
                  Join our professional photoshoot during Saturday's resting period! Please prepare your poses ahead of time and be respectful of others' time. Each session is exactly 3 minutes - make them count! 📷✨
                </p>
                <button 
                  className="book-photoshoot-btn-main"
                  onClick={() => setShowPhotoshootBooking(true)}
                >
                  Book Time Slot
                </button>
              </div>
            )}
            
            {/* Participant Tracking Section */}
            {hasParticipants && (
              <div className="participant-tracking-section">
                <h4>🌱 Join the Cacao Ceremony</h4>
                <p className="participant-description">
                  Help us prepare the right amount of sacred cacao for everyone! 
                </p>
                <p className="participant-count">
                  {participantCount} {participantCount === 1 ? 'person is' : 'people are'} planning to join
                </p>
                <button 
                  className={`participant-btn ${isParticipating ? 'participating' : 'not-participating'}`}
                  onClick={() => {
                    const newParticipating = toggleParticipation(session.title);
                    setIsParticipating(newParticipating);
                    setParticipantCount(getParticipantCount(session.title));
                  }}
                >
                  {isParticipating ? '✅ Count Me In' : '🌱 Count Me In'}
                </button>
              </div>
            )}
            
            {/* Capacity Booking Section */}
            {(() => {
              const bookingStatus = getBookingStatus(session);
              if (!bookingStatus) return null;
              
              const handleAddName = () => {
                setBookingNames([...bookingNames, '']);
              };
              
              const handleRemoveName = (index) => {
                if (bookingNames.length > 1) {
                  setBookingNames(bookingNames.filter((_, i) => i !== index));
                }
              };
              
              const handleNameChange = (index, value) => {
                const newNames = [...bookingNames];
                newNames[index] = value;
                setBookingNames(newNames);
              };
              
              const handleBookSpot = () => {
                const validNames = bookingNames.filter(name => name.trim() !== '');
                if (validNames.length === 0) return;
                
                // Pass the names to toggleBooking for proper counting and Google Sheets sync
                toggleBooking(session.id, validNames);
                setShowBookingForm(false);
                setBookingNames(['']);
                forceUpdate({});
                
                alert(`✅ Booked spot for: ${validNames.join(', ')}\n📋 Booking saved locally`);
              };
              
              return (
                <div className="capacity-booking-section">
                  <h4>📋 Book Your Spot</h4>
                  <p className="booking-description">
                    Limited to {bookingStatus.capacity} participants - secure your spot!
                  </p>
                  <p className="booking-count">
                    {bookingStatus.bookingCount}/{bookingStatus.capacity} spots taken
                    {bookingStatus.spotsLeft > 0 && ` • ${bookingStatus.spotsLeft} left`}
                  </p>
                  
                  {!bookingStatus.isBooked && !showBookingForm && (
                    <button 
                      className={`booking-btn not-booked ${bookingStatus.isFull ? 'full' : ''}`}
                      onClick={() => setShowBookingForm(true)}
                      disabled={bookingStatus.isFull}
                    >
                      {bookingStatus.isFull ? '❌ Session Full' : '📋 Book My Spot'}
                    </button>
                  )}
                  
                  {bookingStatus.isBooked && (
                    <button 
                      className="booking-btn booked"
                      onClick={() => {
                        toggleBooking(session.id, []); // Pass empty array when canceling
                        forceUpdate({});
                      }}
                    >
                      ✅ Spot Booked - Click to Cancel
                    </button>
                  )}
                  
                  {showBookingForm && !bookingStatus.isBooked && (
                    <div className="booking-form">
                      <h5>Who's joining?</h5>
                      {bookingNames.map((name, index) => (
                        <div key={index} className="name-input-row">
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => handleNameChange(index, e.target.value)}
                            placeholder={`Person ${index + 1} name`}
                            className="name-input"
                          />
                          {bookingNames.length > 1 && (
                            <button 
                              type="button"
                              onClick={() => handleRemoveName(index)}
                              className="remove-name-btn"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      
                      <div className="booking-form-actions">
                        <button 
                          type="button"
                          onClick={handleAddName}
                          className="add-name-btn"
                          disabled={bookingNames.length >= bookingStatus.spotsLeft}
                        >
                          + Add Person
                        </button>
                        
                        <div className="booking-buttons">
                          <button 
                            type="button"
                            onClick={() => {
                              setShowBookingForm(false);
                              setBookingNames(['']);
                            }}
                            className="cancel-booking-btn"
                          >
                            Cancel
                          </button>
                          <button 
                            type="button"
                            onClick={handleBookSpot}
                            className="confirm-booking-btn"
                            disabled={bookingNames.filter(name => name.trim() !== '').length === 0}
                          >
                            Book {bookingNames.filter(name => name.trim() !== '').length} Spot{bookingNames.filter(name => name.trim() !== '').length !== 1 ? 's' : ''}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            
            {/* Description - Most Important */}
            {session.description && session.description !== "" && (
              <div className="modal-description-section">
                <h4>About This Workshop</h4>
                <p className="modal-description-text">{session.description}</p>
              </div>
            )}
            
            {/* Workshop Details Grid */}
            <div className="modal-details-grid">
              
              {/* Level */}
              {!isSimplified && !isPhotoshoot && (
                <div className="modal-detail-card">
                  <h5>Level</h5>
                  <span 
                    className="modal-level-badge" 
                    style={{ backgroundColor: getLevelColor(session.level) }}
                  >
                    {session.level}
                  </span>
                </div>
              )}
              
              {/* Duration - Show for all sessions */}
              <div className="modal-detail-card">
                <h5>Duration</h5>
                <span className="modal-duration">{Math.round(getDuration(session.start, session.end))} minutes</span>
              </div>
              
              {/* Prerequisites - Show for simplified sessions AND complex sessions (but not photo-only or photoshoot) */}
              {((isSimplified && session.prereqs && session.prereqs !== "" && session.prereqs !== "TBD") || 
                (!isSimplified && !isPhotoOnly && !isPhotoshoot)) && (
                <div className="modal-detail-card modal-prereqs-card">
                  <h5>Prerequisites</h5>
                  <span className="modal-prereqs">
                    {session.prereqs && session.prereqs !== "" && session.prereqs !== "TBD" ? session.prereqs : "None"}
                  </span>
                </div>
              )}
              
            </div>
            
            {/* Workshop Types/Styles - Hide for simplified sessions and photoshoot */}
            {!isPhotoshoot && !isSimplified && (
              <div className="modal-styles-section">
                <h4>Workshop Types</h4>
                <div className="modal-styles-list">
                  {session.styles.map((style, index) => (
                    <span key={index} className="modal-style-tag">
                      {style}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};

const FilterBar = ({ 
  levelFilter, 
  setLevelFilter, 
  styleFilter, 
  setStyleFilter, 
  searchFilter, 
  setSearchFilter,
  teacherFilter,
  setTeacherFilter,
  availableLevels,
  availableStyles,
  availableTeachers
}) => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  const clearAllFilters = () => {
    setLevelFilter('');
    setStyleFilter('');
    setSearchFilter('');
    setTeacherFilter('');
  };

  const hasActiveFilters = levelFilter || styleFilter || searchFilter || teacherFilter;

  return (
    <div className="filter-container">
      {/* Mobile: Collapsible filter toggle */}
      <div className="mobile-filter-toggle">
        <button 
          className="filters-toggle-btn"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <span>Filters</span>
          {hasActiveFilters && <span className="active-indicator">●</span>}
          <span className={`toggle-arrow ${filtersOpen ? 'open' : ''}`}>▼</span>
        </button>
      </div>

      {/* Filter content - collapsible on mobile */}
      <div className={`filter-bar ${filtersOpen ? 'mobile-open' : ''}`}>
      <div className="filter-group">
        <label>Search:</label>
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Search workshops..."
          className="search-input"
        />
      </div>
      
      <div className="filter-group">
        <label>Level:</label>
        <select 
          value={levelFilter} 
          onChange={(e) => setLevelFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Levels</option>
          {availableLevels.map(level => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </div>
      
      <div className="filter-group">
        <label>Style:</label>
        <select 
          value={styleFilter} 
          onChange={(e) => setStyleFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Styles</option>
          {availableStyles.map(style => (
            <option key={style} value={style}>{style}</option>
          ))}
        </select>
      </div>
      
      <div className="filter-group">
        <label>Teacher:</label>
        <select 
          value={teacherFilter} 
          onChange={(e) => setTeacherFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Teachers</option>
          {availableTeachers.map(teacher => (
            <option key={teacher} value={teacher}>{teacher}</option>
          ))}
        </select>
      </div>
      
      <div className="filter-group">
        <button 
          onClick={clearAllFilters}
          className={`clear-filters-btn ${hasActiveFilters ? 'active' : ''}`}
          disabled={!hasActiveFilters}
        >
          Clear Filters
        </button>
      </div>
    </div>
  </div>
  );
};

const ScheduleTabs = ({ days, activeDay, setActiveDay }) => {
  return (
    <div className="schedule-tabs">
      {days.map(day => (
        <button
          key={day}
          className={`tab ${activeDay === day ? 'active' : ''}`}
          onClick={() => setActiveDay(day)}
        >
          {day}
        </button>
      ))}
    </div>
  );
};

// Photoshoot Booking Modal Component
const PhotoshootBookingModal = ({ onClose, bookings, setBookings }) => {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [names, setNames] = useState(['']);
  
  // Generate a unique device ID for this browser/device
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('mac-photoshoot-device-id');
    if (!deviceId) {
      deviceId = 'device-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('mac-photoshoot-device-id', deviceId);
    }
    return deviceId;
  };
  
  // Get user's bookings from localStorage
  const getUserBookings = () => {
    const deviceId = getDeviceId();
    const userBookings = localStorage.getItem(`mac-photoshoot-bookings-${deviceId}`);
    return userBookings ? JSON.parse(userBookings) : [];
  };
  
  // Save user's booking to localStorage
  const saveUserBooking = (timeSlot, names) => {
    const deviceId = getDeviceId();
    const userBookings = getUserBookings();
    if (!userBookings.includes(timeSlot)) {
      userBookings.push(timeSlot);
      localStorage.setItem(`mac-photoshoot-bookings-${deviceId}`, JSON.stringify(userBookings));
    }
  };
  
  // Remove user's booking from localStorage
  const removeUserBooking = (timeSlot) => {
    const deviceId = getDeviceId();
    const userBookings = getUserBookings();
    const updatedBookings = userBookings.filter(slot => slot !== timeSlot);
    localStorage.setItem(`mac-photoshoot-bookings-${deviceId}`, JSON.stringify(updatedBookings));
  };
  
  // Check if current user can cancel a booking
  const canCancelBooking = (timeSlot) => {
    const userBookings = getUserBookings();
    return userBookings.includes(timeSlot);
  };
  
  // Generate time slots (2 hours, 3-minute intervals = 40 slots)
  const generateTimeSlots = () => {
    const slots = [];
    const startTime = 14 * 60; // 14:00 (2PM) in minutes
    
    for (let i = 0; i < 40; i++) {
      const timeInMinutes = startTime + (i * 3);
      const hours = Math.floor(timeInMinutes / 60);
      const minutes = timeInMinutes % 60;
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      slots.push(timeStr);
    }
    return slots;
  };
  
  const timeSlots = generateTimeSlots();
  
  const handleNameChange = (index, value) => {
    const newNames = [...names];
    newNames[index] = value;
    setNames(newNames);
  };
  
  const addNameField = () => {
    if (names.length < 2) {
      setNames([...names, '']);
    }
  };
  
  const removeNameField = (index) => {
    if (names.length > 1) {
      const newNames = names.filter((_, i) => i !== index);
      setNames(newNames);
    }
  };
  
  const handleBookSlot = async () => {
    if (!selectedSlot) return;
    
    const validNames = names.filter(name => name.trim() !== '');
    if (validNames.length === 0) return;
    
    // CRITICAL FIX: Fetch fresh data from Google Sheets before booking
    console.log('🔄 Checking for conflicts before booking...');
    
    try {
      const freshBookings = await fetchBookingsFromGoogleSheets();
      console.log('📊 Fresh bookings from Google Sheets:', freshBookings);
      
      // Check if someone else already booked this slot
      if (freshBookings && freshBookings[selectedSlot]) {
        alert(`❌ Sorry! Someone else just booked the ${selectedSlot} slot.\n\nBooked by: ${freshBookings[selectedSlot].join(', ')}\n\nPlease choose a different time slot.`);
        
        // Update local state with fresh data to show the conflict
        setBookings(freshBookings);
        setSelectedSlot(null);
        setNames(['']);
        return;
      }
      
      // Slot is still available, proceed with booking
      const newBookings = { ...freshBookings };
      newBookings[selectedSlot] = validNames;
      setBookings(newBookings);
      
      // Save to user's localStorage
      saveUserBooking(selectedSlot, validNames);
      
      // Reset form immediately
      setSelectedSlot(null);
      setNames(['']);
      
      // Show immediate success message
      alert(`✅ Booked ${selectedSlot} for: ${validNames.join(', ')}\n📊 Syncing to Google Sheets...`);
      
      // Try to sync to Google Sheets in background
      syncBookingsToGoogleSheets(newBookings).then(synced => {
        console.log(synced ? '✅ Google Sheets sync completed' : '⚠️ Google Sheets sync failed or not configured');
      }).catch(error => {
        console.error('❌ Google Sheets sync error:', error);
      });
      
    } catch (error) {
      console.error('❌ Error checking for booking conflicts:', error);
      alert('❌ Unable to verify slot availability. Please try again.');
    }
  };
  
  const handleEditBooking = (timeSlot) => {
    // Only allow editing if this user made the booking
    if (!canCancelBooking(timeSlot)) {
      alert('❌ You can only edit bookings that you made from this device.');
      return;
    }
    
    // Load the existing booking into the form
    setSelectedSlot(timeSlot);
    setNames([...bookings[timeSlot]]);
  };
  
  const handleCancelBooking = (timeSlot) => {
    // Only allow cancellation if this user made the booking
    if (!canCancelBooking(timeSlot)) {
      alert('❌ You can only cancel bookings that you made from this device.');
      return;
    }
    
    const newBookings = { ...bookings };
    delete newBookings[timeSlot];
    setBookings(newBookings);
    
    // Remove from user's localStorage
    removeUserBooking(timeSlot);
    
    // Show immediate success message
    alert(`🗑️ Cancelled booking for ${timeSlot}\n📊 Syncing to Google Sheets...`);
    
    // Try to sync to Google Sheets in background
    syncBookingsToGoogleSheets(newBookings).then(synced => {
      console.log(synced ? '✅ Google Sheets sync completed' : '⚠️ Google Sheets sync failed or not configured');
    }).catch(error => {
      console.error('❌ Google Sheets sync error:', error);
    });
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="photoshoot-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-section">
            <h2>📸 Book Your Photoshoot Slot</h2>
            <p>Saturday 14:00-16:00 | 3-minute sessions</p>
          </div>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="photoshoot-modal-body">
          {/* Time Slots Grid */}
          <div className="time-slots-section">
            <h3>Select Your Time Slot</h3>
            <div className="time-slots-grid">
              {timeSlots.map(slot => {
                const isBooked = bookings[slot];
                const isSelected = selectedSlot === slot;
                
                return (
                  <div
                    key={slot}
                    className={`time-slot ${isBooked ? 'booked' : 'available'} ${isSelected ? 'selected' : ''} ${isBooked && canCancelBooking(slot) ? 'user-booking' : ''}`}
                    onClick={() => {
                      if (!isBooked) {
                        setSelectedSlot(slot);
                      } else if (canCancelBooking(slot)) {
                        // Show edit options for user's own booking
                        handleEditBooking(slot);
                      }
                    }}
                  >
                    <div className="slot-time">{slot}</div>
                    {isBooked ? (
                      <div className="slot-booking">
                        <div className="booked-names">{isBooked.join(', ')}</div>
                        {canCancelBooking(slot) && (
                          <div className="user-booking-indicator">✏️ Click to edit</div>
                        )}
                      </div>
                    ) : (
                      <div className="slot-status">Available</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Booking Form - Fixed position overlay */}
          {selectedSlot && (
            <div className="booking-form-overlay">
              <div className="booking-form-card">
                <h4>{bookings[selectedSlot] ? `Edit ${selectedSlot}` : `Book ${selectedSlot}`}</h4>
                <div className="names-input-section">
                  {names.map((name, index) => (
                    <div key={index} className="name-input-row">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => handleNameChange(index, e.target.value)}
                        placeholder={`Name ${index + 1}`}
                        className="name-input"
                        maxLength={30}
                      />
                      {names.length > 1 && (
                        <button 
                          className="remove-name-btn"
                          onClick={() => removeNameField(index)}
                        >
                          ✗
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {names.length < 2 && (
                    <button className="add-name-btn" onClick={addNameField}>
                      + Add Person (Max 2)
                    </button>
                  )}
                  
                  <div className="booking-actions">
                    <button 
                      className="book-slot-btn"
                      onClick={handleBookSlot}
                      disabled={names.filter(n => n.trim()).length === 0}
                    >
                      {bookings[selectedSlot] ? 'Update Booking' : 'Book This Slot'}
                    </button>
                    {bookings[selectedSlot] && (
                      <button 
                        className="delete-booking-btn"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete your booking for ${selectedSlot}?`)) {
                            handleCancelBooking(selectedSlot);
                            setSelectedSlot(null);
                            setNames(['']);
                          }
                        }}
                      >
                        🗑️ Delete Booking
                      </button>
                    )}
                    <button 
                      className="cancel-selection-btn"
                      onClick={() => setSelectedSlot(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  // Debug localStorage on component load
  console.log('🚀 MAC Schedule App Loading...');
  console.log('📋 Current localStorage bookings:', getAllBookings());
  
  // Make debug functions available globally
  if (typeof window !== 'undefined') {
    window.debugBookings = {
      getAll: getAllBookings,
      clear: clearAllLocalBookings,
      setBooking: debugSetBooking
    };
  }
  
  // All useState hooks first
  const [sessions, setSessions] = useState(sessionsData); // Start with local data
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('local');
  const [levelFilter, setLevelFilter] = useState('');
  const [styleFilter, setStyleFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [activeDay, setActiveDay] = useState('All Days');
  
  // Photoshoot booking state
  const [showPhotoshootBooking, setShowPhotoshootBooking] = useState(false);
  const [photoshootBookings, setPhotoshootBookings] = useState({});

  // All useEffect hooks
  useEffect(() => {
    async function loadSessions() {
      try {
        console.log('🔄 Attempting to load from Google Sheets...');
        const googleSheetsSessions = await fetchSessionsFromGoogleSheets();
        if (googleSheetsSessions && googleSheetsSessions.length > 0) {
          // Merge sessions with booking data
          const mergedSessions = await mergeSessionsWithBookings(googleSheetsSessions);
          setSessions(mergedSessions);
          setDataSource('google-sheets');
          console.log('✅ Loaded data from Google Sheets:', mergedSessions.length, 'sessions');
        } else {
          console.log('📄 Falling back to local JSON data');
          const mergedLocalSessions = await mergeSessionsWithBookings(sessionsData);
          setSessions(mergedLocalSessions);
          setDataSource('local');
        }
      } catch (error) {
        console.error('❌ Error loading sessions:', error);
        console.log('📄 Using local JSON data as fallback');
        const mergedLocalSessions = await mergeSessionsWithBookings(sessionsData);
        setSessions(mergedLocalSessions);
        setDataSource('local');
      } finally {
        setLoading(false);
      }
    }

    loadSessions();
  }, []);

  // Load photoshoot bookings from Google Sheets
  useEffect(() => {
    async function loadBookings() {
      try {
        console.log('📊 Loading photoshoot bookings from Google Sheets...');
        const googleSheetsBookings = await fetchBookingsFromGoogleSheets();
        if (googleSheetsBookings) {
          setPhotoshootBookings(googleSheetsBookings);
          console.log('✅ Loaded bookings from Google Sheets:', Object.keys(googleSheetsBookings).length, 'slots booked');
        } else {
          console.log('📄 No bookings found, starting with empty schedule');
          setPhotoshootBookings({});
        }
      } catch (error) {
        console.error('❌ Error loading bookings from Google Sheets:', error);
        console.log('📄 Starting with empty booking schedule');
        setPhotoshootBookings({});
      }
    }

    loadBookings();
  }, []);
  
  // All useMemo hooks
  const sessionsByDay = useMemo(() => groupByDay(sessions), [sessions]);
  const availableDays = useMemo(() => {
    const dayOrder = ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const foundDays = Object.keys(sessionsByDay).filter(day => day); // Remove empty days
    const sortedDays = foundDays.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
    return ['All Days', ...sortedDays];
  }, [sessionsByDay]);
  
  const availableLevels = useMemo(() => 
    [...new Set(sessions.map(session => session.level))]
      .filter(level => level !== "All Levels") // Remove "All Levels" from data
      .sort(), [sessions]
  );
  
  const availableStyles = useMemo(() => 
    [...new Set(sessions.flatMap(session => session.styles))].sort(), [sessions]
  );
  
  const availableTeachers = useMemo(() => 
    [...new Set(sessions.flatMap(session => session.teachers))].filter(teacher => teacher).sort(), [sessions]
  );

  const filteredSessions = useMemo(() => {
    let sessionsToFilter = activeDay === 'All Days' ? sessions : (sessionsByDay[activeDay] || []);
    
    if (levelFilter) {
      sessionsToFilter = sessionsToFilter.filter(session => session.level === levelFilter);
    }
    
    if (styleFilter) {
      sessionsToFilter = sessionsToFilter.filter(session => session.styles.includes(styleFilter));
    }
    
    if (teacherFilter) {
      sessionsToFilter = sessionsToFilter.filter(session => session.teachers.includes(teacherFilter));
    }
    
    if (searchFilter) {
      const searchLower = searchFilter.toLowerCase();
      sessionsToFilter = sessionsToFilter.filter(session =>
        session.title.toLowerCase().includes(searchLower) ||
        session.description.toLowerCase().includes(searchLower) ||
        session.teachers.some(teacher => teacher.toLowerCase().includes(searchLower)) ||
        session.styles.some(style => style.toLowerCase().includes(searchLower))
      );
    }
    
    // Sort sessions by day and then by start time
    return sessionsToFilter.sort((a, b) => {
      if (activeDay === 'All Days') {
        const dayOrder = ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const dayComparison = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
        if (dayComparison !== 0) return dayComparison;
      }
      return a.start.localeCompare(b.start);
    });
  }, [sessions, sessionsByDay, activeDay, levelFilter, styleFilter, teacherFilter, searchFilter]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Loading MAC 2025 Schedule...</p>
          <p className="text-sm text-blue-500 mt-2">
            {dataSource === 'google-sheets' ? 'Fetching latest updates...' : 'Loading schedule...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-container">
              <img 
                src="/mac-logo.png" 
                alt="MAC Logo" 
                className="mac-logo"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="logo-placeholder" style={{ display: 'none' }}>MAC</div>
            </div>
            <div className="title-section">
              <h1>MAC 2025</h1>
              <p>Mediterranean Acro Convention</p>
            </div>
          </div>
          <div className="header-info">
            <p>Malta | October 8-12, 2025</p>
          </div>
        </div>
      </header>

      {/* Main Content Container for Desktop Framing */}
      <div className="main-content-frame">
        {/* Day Tabs */}
        <ScheduleTabs 
          days={availableDays} 
          activeDay={activeDay} 
          setActiveDay={setActiveDay} 
        />

        {/* Filters */}
        <FilterBar
          levelFilter={levelFilter}
          setLevelFilter={setLevelFilter}
          styleFilter={styleFilter}
          setStyleFilter={setStyleFilter}
          searchFilter={searchFilter}
          setSearchFilter={setSearchFilter}
          teacherFilter={teacherFilter}
          setTeacherFilter={setTeacherFilter}
          availableLevels={availableLevels}
          availableStyles={availableStyles}
          availableTeachers={availableTeachers}
        />

      {/* Session Grid */}
      {activeDay === 'All Days' ? (
        // Show grouped by day when viewing all - in chronological order
        (() => {
          const dayOrder = ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          return dayOrder.filter(day => sessionsByDay[day] && sessionsByDay[day].length > 0).map(day => {
            const daySessions = sessionsByDay[day];
            const filteredDaySessions = daySessions.filter(session => {
              if (levelFilter && session.level !== levelFilter) return false;
              if (styleFilter && !session.styles.includes(styleFilter)) return false;
              if (teacherFilter && !session.teachers.includes(teacherFilter)) return false;
              if (searchFilter) {
                const searchLower = searchFilter.toLowerCase();
                return session.title.toLowerCase().includes(searchLower) ||
                       session.description.toLowerCase().includes(searchLower) ||
                       session.teachers.some(teacher => teacher.toLowerCase().includes(searchLower)) ||
                       session.styles.some(style => style.toLowerCase().includes(searchLower));
              }
              return true;
            }).sort((a, b) => a.start.localeCompare(b.start));

            if (filteredDaySessions.length === 0) return null;

            return (
              <div key={day} className="day-section">
                <h2 className="day-header">{day}</h2>
                <div className="sessions-grid">
                  {filteredDaySessions.map(session => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onClick={setSelectedSession}
                      onStyleClick={setStyleFilter}
                      setShowPhotoshootBooking={setShowPhotoshootBooking}
                    />
                  ))}
                </div>
              </div>
            );
          });
        })()
      ) : (
        // Show individual day sessions  
        <div className="day-content">
          <div className="sessions-grid">
            {filteredSessions
              .sort((a, b) => a.start.localeCompare(b.start))
              .map(session => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onClick={setSelectedSession}
                  onStyleClick={setStyleFilter}
                  setShowPhotoshootBooking={setShowPhotoshootBooking}
                />
              ))}
          </div>
          
          {filteredSessions.length === 0 && (
            <div className="no-sessions">
              <p>No workshops found for the selected filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Session Modal */}
      <SessionModal 
        session={selectedSession} 
        onClose={() => setSelectedSession(null)}
        setShowPhotoshootBooking={setShowPhotoshootBooking}
      />
      
      {/* Photoshoot Booking Modal */}
      {showPhotoshootBooking && (
        <PhotoshootBookingModal
          onClose={() => setShowPhotoshootBooking(false)}
          bookings={photoshootBookings}
          setBookings={setPhotoshootBookings}
        />
      )}
      
      </div> {/* Close main-content-frame */}
    </div>
  );
}