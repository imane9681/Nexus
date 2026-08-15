import React, { useState, useEffect, useRef } from 'react';
import { 
  HiChevronLeft, HiChevronRight, HiPlus, HiX, 
  HiCalendar, HiClock, HiTrash, HiPencil, HiCheckCircle,
  HiOutlineCalendar, HiOutlineClock, HiTag, HiColorSwatch,
  HiBell, HiRefresh, HiChevronDown, HiSun, HiMoon,
  HiViewList, HiViewGrid, HiFilter, HiStar, HiUsers
} from 'react-icons/hi';

// ==================== Component لبطاقة الإحصائيات ====================
const StatCard = ({ icon: Icon, title, value, color, darkMode }) => {
  const getGradient = () => {
    const gradients = {
      white: 'bg-white/20 shadow-sm',
      
    };
    return gradients[color] || gradients.blue;
  };

  return (
    <div className={`relative rounded-2xl p-4 transition-all duration-300 hover:shadow-lg overflow-hidden ${getGradient()}`}>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-white/20">
              <Icon className="text-white text-lg" />
            </div>
            <p className="text-sm font-semibold text-white">{title}</p>
          </div>
        </div>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
      </div>
    </div>
  );
};

// ==================== Component لعرض الحدث في التقويم مع زر حذف صغير ====================
const EventBadge = ({ event, onDelete, onEdit, darkMode }) => {
  return (
    <div 
      className="group flex items-center justify-between gap-1 text-xs px-2 py-1 rounded-lg transition-all duration-200 hover:brightness-90 hover:shadow-md"
      style={{ 
        backgroundColor: event.color + '25', 
        borderLeft: `3px solid ${event.color}`,
        color: darkMode ? '#e5e7eb' : '#1f2937'
      }}
    >
      <div 
        onClick={(e) => { e.stopPropagation(); onEdit(event); }}
        className="flex-1 truncate cursor-pointer flex items-center gap-1.5"
      >
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: event.color }} />
        <span className="truncate">{event.title}</span>
      </div>
      
      <button
        onClick={(e) => { 
          e.stopPropagation(); 
          onDelete(event.id, event.title); 
        }}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all hover:bg-red-500/20 flex-shrink-0"
        title="Delete event"
      >
        <HiTrash size={10} className="text-red-500" />
      </button>
    </div>
  );
};

// ==================== مكون تأكيد الحذف ====================
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, eventTitle, darkMode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className={`rounded-2xl p-6 w-[400px] shadow-2xl animate-modal-pop ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <HiTrash className="text-red-500 text-2xl" />
          </div>
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Delete Event
          </h3>
        </div>
        
        <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Are you sure you want to delete the event <span className="font-semibold">"{eventTitle}"</span>?
          <br />
          <span className="text-sm mt-2 block">This action cannot be undone.</span>
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl font-medium transition-all bg-red-600 text-white hover:bg-red-700"
          >
            Delete Permanently
          </button>
          <button
            onClick={onClose}
            className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
              darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== مكون التقويم الرئيسي ====================
function Calendar({ token, darkMode }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState(null);
  const [deletingEventTitle, setDeletingEventTitle] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    all_day: false,
    color: '#3b82f6'
  });

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    setLoading(true);
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/calendar/events?start=${start.toISOString()}&end=${end.toISOString()}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setShowModal(false);
        resetForm();
        fetchEvents();
      }
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const updateEvent = async (e) => {
    e.preventDefault();
    if (!editingEvent) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/calendar/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setShowModal(false);
        resetForm();
        fetchEvents();
      }
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  // دالة حذف الحدث - تفتح نافذة التأكيد
  const deleteEvent = (eventId, eventTitle) => {
    setDeletingEventId(eventId);
    setDeletingEventTitle(eventTitle);
    setShowDeleteModal(true);
  };

  // تأكيد حذف الحدث
  const confirmDeleteEvent = async () => {
    if (!deletingEventId) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/calendar/events/${deletingEventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        await fetchEvents();
        setShowDeleteModal(false);
        setDeletingEventId(null);
        setDeletingEventTitle('');
      } else {
        console.error('Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      all_day: false,
      color: '#3b82f6'
    });
    setSelectedDate(null);
    setEditingEvent(null);
  };

  const openCreateModal = (date = null) => {
    if (date) {
      const formattedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0);
      setFormData(prev => ({ ...prev, start_date: formattedDate.toISOString().slice(0, 16) }));
      setSelectedDate(date);
    }
    setEditingEvent(null);
    setShowModal(true);
  };

  const openEditModal = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      start_date: event.start_date.slice(0, 16),
      end_date: event.end_date ? event.end_date.slice(0, 16) : '',
      all_day: event.all_day || false,
      color: event.color || '#3b82f6'
    });
    setShowModal(true);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    const days = [];
    // أيام الشهر السابق
    for (let i = 0; i < startDayOfWeek; i++) {
      const prevDate = new Date(year, month, -startDayOfWeek + i + 1);
      days.push({ date: prevDate, isCurrentMonth: false, events: [] });
    }
    
    // أيام الشهر الحالي
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.start_date);
        return eventDate.getDate() === i && 
               eventDate.getMonth() === month && 
               eventDate.getFullYear() === year;
      });
      days.push({ date, isCurrentMonth: true, events: dayEvents });
    }
    
    // أيام الشهر التالي
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, isCurrentMonth: false, events: [] });
    }
    
    return days;
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventStats = () => {
    const total = events.length;
    const upcoming = events.filter(e => new Date(e.start_date) > new Date()).length;
    const today = events.filter(e => {
      const eventDate = new Date(e.start_date);
      const todayDate = new Date();
      return eventDate.getDate() === todayDate.getDate() &&
             eventDate.getMonth() === todayDate.getMonth() &&
             eventDate.getFullYear() === todayDate.getFullYear();
    }).length;
    return { total, upcoming, today };
  };

  const days = getDaysInMonth();
  const stats = getEventStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative p-7 pb-9  bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl overflow-hidden ">
        {/* الصورة في الخلفية */}
       <img 
         src="/Group 1261152731.png" 
         alt=""
         className="absolute inset-0 w-full h-full opacity-50"
        />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-white'}`}>
            Calendar
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-200' : 'text-gray-200'}`}>
            Manage your schedule and events
          </p>
        </div>
        <button
          onClick={() => openCreateModal()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-blue-400 to-purple-500 text-white"
        >
          <HiPlus size={18} />
          Add Event
        </button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={HiCalendar} title="Total Events" value={stats.total} color="white" darkMode={darkMode} />
        <StatCard icon={HiBell} title="Upcoming" value={stats.upcoming} color="white" darkMode={darkMode} />
        <StatCard icon={HiStar} title="Today" value={stats.today} color="white" darkMode={darkMode} />
      </div>
      </div>

      {/* Calendar Container */}
      <div className={`rounded-2xl border overflow-hidden ${
        darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        
        {/* Calendar Navigation */}
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700/50' : 'border-gray-100'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${
                darkMode ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20' : 'bg-gradient-to-br from-blue-500/10 to-purple-500/10'
              } flex items-center justify-center`}>
                <HiCalendar className={`text-lg ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {events.length} events this month
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={goToToday}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  darkMode ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Today
              </button>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                  className={`p-2 rounded-lg transition-all ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'}`}
                >
                  <HiChevronLeft size={20} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                  className={`p-2 rounded-lg transition-all ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'}`}
                >
                  <HiChevronRight size={20} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                </button>
              </div>
              <button
                onClick={fetchEvents}
                className={`p-2 rounded-lg transition-all ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'}`}
              >
                <HiRefresh size={18} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Day Names */}
            <div className="grid grid-cols-7 gap-px">
              {dayNames.map(day => (
                <div key={day} className={`py-3 text-center text-xs font-semibold tracking-wider ${
                  darkMode ? 'text-gray-400 bg-gray-800/30' : 'text-gray-500 bg-gray-50/50'
                }`}>
                  {day}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-px bg-gray-100 dark:bg-gray-700/30">
              {days.map((day, idx) => {
                const isToday = new Date().toDateString() === day.date.toDateString();
                const hasEvents = day.events.length > 0;
                
                return (
                  <div
                    key={idx}
                    onClick={() => openCreateModal(day.date)}
                    className={`min-h-[110px] p-2 cursor-pointer transition-all duration-200 ${
                      darkMode ? 'bg-gray-800/80 hover:bg-gray-700/80' : 'bg-white hover:bg-gray-50'
                    } ${!day.isCurrentMonth ? 'opacity-40' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-sm font-medium inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all ${
                        isToday 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' 
                          : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}>
                        {day.date.getDate()}
                      </span>
                      {hasEvents && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/10 text-blue-600'
                        }`}>
                          {day.events.length}
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-1 space-y-1 max-h-[70px] overflow-y-auto scrollbar-thin">
                      {day.events.slice(0, 3).map(event => (
                        <EventBadge 
                          key={event.id} 
                          event={event} 
                          onDelete={deleteEvent} 
                          onEdit={openEditModal}
                          darkMode={darkMode} 
                        />
                      ))}
                      {day.events.length > 3 && (
                        <div className={`text-xs text-center py-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          +{day.events.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Create/Edit Event Modal */}
      {showModal && (
        <EventModal
          formData={formData}
          setFormData={setFormData}
          selectedDate={selectedDate}
          colors={colors}
          onSubmit={editingEvent ? updateEvent : createEvent}
          onClose={() => { setShowModal(false); resetForm(); }}
          darkMode={darkMode}
          isEditing={!!editingEvent}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingEventId(null);
          setDeletingEventTitle('');
        }}
        onConfirm={confirmDeleteEvent}
        eventTitle={deletingEventTitle}
        darkMode={darkMode}
      />
    </div>
  );
}

// ==================== مكون نافذة الحدث ====================
function EventModal({ formData, setFormData, selectedDate, colors, onSubmit, onClose, darkMode, isEditing }) {
  const themeInput = darkMode ? 'bg-gray-700/80 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400';

  useEffect(() => {
    if (selectedDate && !formData.start_date) {
      const date = new Date(selectedDate);
      date.setHours(12, 0);
      setFormData(prev => ({ ...prev, start_date: date.toISOString().slice(0, 16) }));
    }
  }, [selectedDate]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`rounded-2xl p-6 w-[450px] shadow-2xl animate-modal-pop ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              {isEditing ? <HiPencil className="text-white text-xl" /> : <HiCalendar className="text-white text-xl" />}
            </div>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {isEditing ? 'Edit Event' : 'Add New Event'}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-lg transition-all hover:scale-110 ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <HiX size={18} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1.5 flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <HiTag size={14} />
              Event Title
            </label>
            <input
              type="text"
              placeholder="Enter event title..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${themeInput}`}
              required
              autoFocus
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1.5 flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <HiOutlineCalendar size={14} />
              Description
            </label>
            <textarea
              placeholder="Enter event description (optional)..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="2"
              className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none ${themeInput}`}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1.5 flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <HiOutlineClock size={14} />
                Start
              </label>
              <input
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${themeInput}`}
                required
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1.5 flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <HiOutlineClock size={14} />
                End
              </label>
              <input
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${themeInput}`}
              />
            </div>
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1.5 flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <HiColorSwatch size={14} />
              Event Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {colors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-9 h-9 rounded-xl transition-all duration-200 hover:scale-110 ${
                    formData.color === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <label className={`flex items-center gap-2 cursor-pointer ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <input
                type="checkbox"
                checked={formData.all_day}
                onChange={(e) => setFormData({ ...formData, all_day: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">All day event</span>
            </label>
          </div>
          
          <div className="flex gap-3 pt-3">
            <button 
              type="submit" 
              className="flex-1 py-2.5 rounded-xl font-medium transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              {isEditing ? 'Update Event' : 'Create Event'}
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className={`flex-1 py-2.5 rounded-xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${
                darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Calendar;