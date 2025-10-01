'use client';
import React, { useState, useMemo } from 'react';
import sessionsData from '../data/sessions.json';

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
    'andre': 'andre-daria.jpg' // Use the pair photo for Andre since no individual photo
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

const SessionCard = ({ session, onClick }) => {
  const size = getSessionSize(session);
  const isMeal = session.title === 'Breakfast' || session.title === 'Lunch' || session.title === 'Dinner';
  const isDemo = session.title.includes('Demo') || session.title.includes('Warm Up');
  
  // List of special sessions that should only show Name, Time, and Location (no teacher photos)
  const simplifiedSessions = [
    'Arrival & Registration',
    'Opening Circle and Ice breaker games',
    'Dinner & Break',
    'Acro Speed Dating',
    'Jam',
    'Registration',
    'Pool/Relax/Jam'
  ];
  
  // List of sessions that should show Name, Time, Location, and Photo only (no level/prereqs)
  const photoOnlySessions = [
    'Yoga with Daria',
    'Yoga with Maria',
    'Aerial Yoga with Svetlana',
    'Sound Healing with Mads',
    'Thai Massage with Flo',
    'Cacao Ceremony with Daria',
    'Therapeutics with Andre'
  ];
  
  const isSimplified = isMeal || isDemo || simplifiedSessions.includes(session.title);
  const isPhotoOnly = photoOnlySessions.includes(session.title);
  
  // Simplified card for meals, demos, and special sessions
  if (isSimplified) {
    return (
      <div className={`session-card session-card-${size} simple-card`} onClick={() => onClick(session)}>
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
        </div>
      </div>
    );
  }
  
  // Photo-only card for special sessions (name, time, location, photo only)
  if (isPhotoOnly) {
    return (
      <div className={`session-card session-card-${size} photo-only-card`} onClick={() => onClick(session)}>
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
        </div>
      </div>
    );
  }
  
  // Full card for workshops with simplified layout
  return (
    <div className={`session-card session-card-${size}`} onClick={() => onClick(session)}>
      {/* 1. Name */}
      <div className="session-header">
        <h3 className="session-title session-title-fixed-height">{session.title}</h3>
        <button className="info-button" onClick={(e) => { e.stopPropagation(); onClick(session); }}>
          <span>ℹ</span>
        </button>
      </div>
      
      <div className="session-content">
        {/* 2. Time/Room */}
        <div className="session-time-location">
          <span className="time">{timeRange(session.start, session.end)}</span>
          <span className="location">{session.location}</span>
        </div>
        
        {/* 3. Level */}
        <div className="session-level">
          <span 
            className="level-badge" 
            style={{ backgroundColor: getLevelColor(session.level) }}
          >
            {session.level}
          </span>
        </div>
        
        {/* 4. Prerequisites - show for all workshops */}
        <div className="prereqs">
          <strong>Pre-Reqs:</strong> {session.prereqs && session.prereqs !== "" && session.prereqs !== "TBD" ? session.prereqs : "None"}
        </div>
        
        {/* 5. Teachers with profile picture positioned at bottom right */}
        {session.teachers && session.teachers.length > 0 && (
          <div className="teachers-section">
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
          </div>
        )}
        
        {/* 6. Tags and Teacher Photo inline */}
        <div className="styles-and-photo">
          <div className="styles">
            {session.styles.map((style, index) => (
              <span key={index} className="style-tag">{style}</span>
            ))}
          </div>
          {session.teachers && session.teachers.length > 0 && (
            <div className="teacher-photo-inline">
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
    </div>
  );
};

const SessionModal = ({ session, onClose }) => {
  if (!session) return null;

  // Check if this is a simplified session (same logic as in SessionCard)
  const isMeal = session.title === 'Breakfast' || session.title === 'Lunch' || session.title === 'Dinner';
  const isDemo = session.title.includes('Demo') || session.title.includes('Warm Up');
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{session.title}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="session-details">
            <div className="detail-row-flex">
              <div className="detail-item">
                <strong>Time:</strong> {timeRange(session.start, session.end)}
              </div>
              <div className="detail-item">
                <strong>Day:</strong> {session.day}
              </div>
              <div className="detail-item">
                <strong>Location:</strong> {session.location}
              </div>
            </div>
            
            {!isSimplified && (
              <div className="detail-row">
                <strong>Level:</strong> 
                <span 
                  className="level-badge level-badge-modal" 
                  style={{ backgroundColor: getLevelColor(session.level) }}
                >
                  {session.level}
                </span>
              </div>
            )}
            
            {session.teachers && session.teachers.length > 0 && (
              <div className="detail-row">
                <strong>Teachers:</strong> {session.teachers.join(' and ')}
              </div>
            )}
            
            {session.description && session.description !== "" && (
              <div className="detail-row">
                <strong>Description:</strong>
                <p className="description-text">{session.description}</p>
              </div>
            )}
            
            {!isSimplified && !isPhotoOnly && (
              <div className="detail-row">
                <strong>Prerequisites:</strong>
                <p className="prereqs-text">
                  {session.prereqs && session.prereqs !== "" && session.prereqs !== "TBD" ? session.prereqs : "None"}
                </p>
              </div>
            )}
            
            <div className="detail-row">
              <strong>Styles:</strong>
              <div className="styles-list">
                {session.styles.map((style, index) => (
                  <span key={index} className="style-tag">{style}</span>
                ))}
              </div>
            </div>
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
  const clearAllFilters = () => {
    setLevelFilter('');
    setStyleFilter('');
    setSearchFilter('');
    setTeacherFilter('');
  };

  const hasActiveFilters = levelFilter || styleFilter || searchFilter || teacherFilter;

  return (
    <div className="filter-bar">
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

export default function Home() {
  const [levelFilter, setLevelFilter] = useState('');
  const [styleFilter, setStyleFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  
  // Group sessions by day and get available days
  const sessionsByDay = useMemo(() => groupByDay(sessionsData), []);
  const availableDays = useMemo(() => ['All Days', ...sortDays(Object.keys(sessionsByDay))], [sessionsByDay]);
  const [activeDay, setActiveDay] = useState('All Days');
  
  // Get unique levels, styles, and teachers for filters
  const availableLevels = useMemo(() => 
    [...new Set(sessionsData.map(session => session.level))]
      .filter(level => level !== "All Levels") // Remove "All Levels" from data
      .sort(), []
  );
  
  const availableStyles = useMemo(() => 
    [...new Set(sessionsData.flatMap(session => session.styles))].sort(), []
  );
  
  const availableTeachers = useMemo(() => 
    [...new Set(sessionsData.flatMap(session => session.teachers))].filter(teacher => teacher).sort(), []
  );
  
  // Filter sessions for active day
  const filteredSessions = useMemo(() => {
    let sessions = activeDay === 'All Days' ? sessionsData : (sessionsByDay[activeDay] || []);
    
    if (levelFilter) {
      sessions = sessions.filter(session => session.level === levelFilter);
    }
    
    if (styleFilter) {
      sessions = sessions.filter(session => session.styles.includes(styleFilter));
    }
    
    if (teacherFilter) {
      sessions = sessions.filter(session => session.teachers.includes(teacherFilter));
    }
    
    if (searchFilter) {
      const searchLower = searchFilter.toLowerCase();
      sessions = sessions.filter(session =>
        session.title.toLowerCase().includes(searchLower) ||
        session.description.toLowerCase().includes(searchLower) ||
        session.teachers.some(teacher => teacher.toLowerCase().includes(searchLower)) ||
        session.styles.some(style => style.toLowerCase().includes(searchLower))
      );
    }
    
    // Sort sessions by day and then by start time
    return sessions.sort((a, b) => {
      if (activeDay === 'All Days') {
        const dayOrder = ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const dayComparison = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
        if (dayComparison !== 0) return dayComparison;
      }
      return a.start.localeCompare(b.start);
    });
  }, [sessionsByDay, activeDay, levelFilter, styleFilter, teacherFilter, searchFilter]);

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
        // Show grouped by day when viewing all
        Object.entries(sessionsByDay).map(([day, daySessions]) => {
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
                  />
                ))}
              </div>
            </div>
          );
        })
      ) : (
        // Show structured by time slots for individual days
        <div className="day-content">
          {(() => {
            const timeSlots = groupByTimeSlots(filteredSessions);
            const sortedTimeSlots = Object.keys(timeSlots).sort();
            
            return sortedTimeSlots.map(timeSlot => (
              <div key={timeSlot} className="time-slot">
                <h3 className="time-header">{timeSlot}</h3>
                <div className="sessions-grid">
                  {timeSlots[timeSlot].map(session => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onClick={setSelectedSession}
                    />
                  ))}
                </div>
              </div>
            ));
          })()}
          
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
      />
      
      </div> {/* Close main-content-frame */}
    </div>
  );
}