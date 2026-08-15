import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  HiClock, HiArchive, HiRefresh, HiFilter, HiCalendar, HiSearch, HiX,
  HiTrash, HiUser, HiChat, HiDatabase, HiTrendingUp, HiDocumentText,
  HiChevronLeft, HiChevronRight, HiEye, HiEyeOff, HiStar, HiSparkles,
  HiPlus, HiSortAscending, HiSortDescending, HiCheck, HiArrowLeft, HiChevronDown
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

// ==================== Component لعنصر الرسالة ====================
const MessageItem = ({ message, isSelected, onClick, darkMode }) => {
  return (
    <div
      onClick={() => onClick(message.id)}
      className={`group p-4 rounded-xl cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'bg-gradient-to-r from-blue-500/15 to-purple-500/15 border border-blue-500/30 shadow-md' 
          : `${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} border border-transparent`
      } ${message.is_deleted ? 'opacity-75' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm flex-shrink-0`}>
            <span className="text-white text-xs font-medium">
              {message.username?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <strong className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {message.username}
            </strong>
            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {new Date(message.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        {message.is_deleted && (
          <div className="px-1.5 py-0.5 rounded-full bg-red-500/20 flex-shrink-0">
            <HiTrash size={10} className="text-red-500" />
          </div>
        )}
      </div>
      
      <div className="ml-11">
        <p className={`text-sm break-words whitespace-pre-wrap ${
          message.is_deleted 
            ? 'text-red-500 line-through' 
            : darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {message.content}
        </p>
      </div>
      
      {message.backup_count > 0 && (
        <div className="flex items-center gap-1.5 mt-2 ml-11">
          <div className="w-5 h-5 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <HiArchive size={10} className="text-emerald-500" />
          </div>
          <span className="text-xs text-emerald-500 font-medium">
            {message.backup_count} backup(s) available
          </span>
        </div>
      )}
    </div>
  );
};

// ==================== Component لعنصر النسخة الاحتياطية ====================
const BackupItem = ({ backup, onRestore, darkMode }) => {
  return (
    <div className={`p-4 rounded-xl transition-all duration-200 group ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-amber-50 border-amber-200'} border hover:shadow-md`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${darkMode ? 'bg-gray-600' : 'bg-amber-100'}`}>
            <HiCalendar size={12} className={darkMode ? 'text-gray-400' : 'text-amber-600'} />
          </div>
          <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-amber-600'}`}>
            {new Date(backup.backed_up_at).toLocaleString()}
          </span>
        </div>
        <button
          onClick={() => onRestore(backup.id)}
          className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs rounded-lg hover:shadow-lg transition-all hover:scale-105 flex items-center gap-1 flex-shrink-0"
        >
          <HiRefresh size={10} /> Restore
        </button>
      </div>
      <div className="ml-8">
        <p className={`text-sm break-words whitespace-pre-wrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {backup.content_snapshot}
        </p>
      </div>
    </div>
  );
};

// ==================== Component لشريط التحميل ====================
const LoadingSpinner = ({ darkMode }) => (
  <div className="flex items-center justify-center py-12">
    <div className={`w-8 h-8 border-3 rounded-full animate-spin ${darkMode ? 'border-gray-700 border-t-blue-500' : 'border-gray-200 border-t-blue-500'}`}></div>
  </div>
);

// ==================== Component للحالة الفارغة ====================
const EmptyState = ({ icon: Icon, title, message, darkMode }) => (
  <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
    <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
      <Icon className={`text-2xl ${darkMode ? 'text-gray-500' : 'text-blue-400'}`} />
    </div>
    <p className="text-sm">{title}</p>
    <p className="text-xs mt-1">{message}</p>
  </div>
);

// ==================== Component لترقيم الصفحات ====================
const Pagination = ({ page, totalPages, onPageChange, darkMode }) => {
  if (totalPages <= 1) return null;
  
  return (
    <div className={`flex justify-between items-center px-5 py-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className={`p-2 rounded-lg transition-all flex items-center gap-1 ${
          darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
        } ${page === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <HiChevronLeft size={16} />
        <span className="text-sm">Previous</span>
      </button>
      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className={`p-2 rounded-lg transition-all flex items-center gap-1 ${
          darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
        } ${page === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="text-sm">Next</span>
        <HiChevronRight size={16} />
      </button>
    </div>
  );
};

// ==================== Component لخيارات الترتيب ====================
// ==================== Component لخيارات الترتيب ====================
const SortDropdown = ({ sortBy, sortOrder, onSortChange, darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortOptions = [
    { value: 'created_at', label: 'Date', icon: HiClock },
    { value: 'username', label: 'User', icon: HiUser },
    { value: 'content', label: 'Content', icon: HiChat }
  ];

  const currentOption = sortOptions.find(opt => opt.value === sortBy);

  const getButtonLabel = () => {
    switch (sortBy) {
      case 'created_at': return 'Date';
      case 'username': return 'User';
      case 'content': return 'Content';
      default: return 'Sort';
    }
  };

  // أيقونة الزر الرئيسي
  const getButtonIcon = () => {
    switch (sortBy) {
      case 'created_at': return <HiClock size={14} className="flex-shrink-0" />;
      case 'username': return <HiUser size={14} className="flex-shrink-0" />;
      case 'content': return <HiChat size={14} className="flex-shrink-0" />;
      default: return null;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${
          darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }`}
      >
        {getButtonIcon()}
        <span className="text-sm font-medium">
          {getButtonLabel()}
        </span>
        <HiChevronDown 
          size={18} 
          className={`ml-0.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-500'} flex-shrink-0`} 
        />
      </button>
      
      {isOpen && (
        <div className={`absolute right-0 mt-2 w-44 rounded-xl shadow-lg border z-10 overflow-hidden ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          {sortOptions.map(option => {
            const Icon = option.icon;
            const isSelected = sortBy === option.value;
            return (
              <button
                key={option.value}
                onClick={() => {
                  if (sortBy === option.value) {
                    onSortChange(option.value, sortOrder === 'ASC' ? 'DESC' : 'ASC');
                  } else {
                    onSortChange(option.value, 'DESC');
                  }
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                  isSelected
                    ? 'bg-blue-500/20 text-blue-500'
                    : darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={14} className="flex-shrink-0" />
                  <span>{option.label}</span>
                </div>
                {isSelected && (
                  <span className="text-xs font-medium">
                    {sortOrder === 'ASC' ? '↑' : '↓'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
// ==================== المكون الرئيسي TimeTravel ====================
function TimeTravel({ token, darkMode, onRestore, onBackToChat }) {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [backups, setBackups] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleted, setShowDeleted] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [restoring, setRestoring] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const itemsPerPage = 20;

  const fetchHistory = useCallback(async () => {
    setLoadingMessages(true);
    try {
      const offset = (page - 1) * itemsPerPage;
      const response = await fetch(
        `http://localhost:5000/api/messages/history?limit=${itemsPerPage}&offset=${offset}&includeDeleted=${showDeleted}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      setMessages(data.messages || data);
      setTotalPages(data.totalPages || Math.ceil((data.total || data.length) / itemsPerPage));
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoadingMessages(false);
    }
  }, [token, page, showDeleted, sortBy, sortOrder]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/timeline/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [token]);

  const fetchBackups = useCallback(async (messageId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/backups/${messageId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setBackups(data);
      const selected = messages.find(m => m.id === messageId);
      setSelectedMessage(selected);
    } catch (error) {
      console.error('Error fetching backups:', error);
    } finally {
      setLoading(false);
    }
  }, [token, messages]);

  const handleRestore = async (backupId) => {
    setRestoring(true);
    try {
      const response = await fetch(`http://localhost:5000/api/restore/${backupId}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (result.success) {
        setSuccessMessage('Message restored successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
        
        // العودة إلى الدردشة بعد الاستعادة
        if (onBackToChat) {
          setTimeout(() => {
            onBackToChat();
          }, 1500);
        }
        
        await fetchHistory();
        await fetchStats();
        setSelectedMessage(null);
        setBackups([]);
        if (onRestore) onRestore();
      } else {
        alert('Failed to restore: ' + result.error);
      }
    } catch (error) {
      console.error('Error restoring:', error);
      alert('Failed to restore message');
    } finally {
      setRestoring(false);
    }
  };

  const filteredMessages = useMemo(() => {
    let filtered = [...messages];
    
    if (filter === 'withBackups') {
      filtered = filtered.filter(msg => msg.backup_count > 0);
    } else if (filter === 'noBackups') {
      filtered = filtered.filter(msg => msg.backup_count === 0);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(msg => 
        msg.content?.toLowerCase().includes(term) ||
        msg.username?.toLowerCase().includes(term)
      );
    }
    
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'username':
          aVal = a.username || '';
          bVal = b.username || '';
          break;
        case 'content':
          aVal = a.content || '';
          bVal = b.content || '';
          break;
        default:
          aVal = new Date(a.created_at);
          bVal = new Date(b.created_at);
      }
      if (sortOrder === 'ASC') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return filtered;
  }, [messages, filter, searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    fetchHistory();
    fetchStats();
  }, [fetchHistory, fetchStats, page, showDeleted, sortBy, sortOrder]);

  useEffect(() => {
    setPage(1);
  }, [filter, searchTerm, showDeleted]);

  const totalMessages = stats?.total_messages || 0;
  const totalBackups = stats?.total_backups || 0;
  const backupRatio = totalMessages > 0 ? Math.round((totalBackups / totalMessages) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* رسالة النجاح */}
      {successMessage && (
        <div className="fixed top-20 right-4 z-50 animate-slideIn">
          <div className="bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <HiCheck size={16} />
            <span className="text-sm">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Header مع زر العودة */}
       <div className="relative p-7 pb-9  bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl overflow-hidden ">
        {/* الصورة في الخلفية */}
       <img 
         src="/Group 1261152731.png" 
         alt=""
         className="absolute inset-0 w-full h-full opacity-50"
        />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onBackToChat && onBackToChat()}
            className={`p-2 rounded-xl transition-all duration-200 ${darkMode ? 'hover:bg-white/20' : 'hover:bg-white/20'}`}
          >
            <HiArrowLeft size={20} className={darkMode ? 'text-gray-200' : 'text-gray-200'} />
          </button>
          <div>
            <h1 className={`text-2xl md:text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-white'}`}>
              Time Travel
            </h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-200' : 'text-gray-200'}`}>
              Browse and restore message history
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full  ${darkMode ? 'bg-gradient-to-br from-blue-400 to-purple-500 ' : 'bg-gradient-to-br from-blue-400 to-purple-500 '}`}>
          <div className="w-2 h-2 bg-green-200 rounded-full animate-pulse"></div>
          <span className={`text-xs font-medium ${darkMode ? 'text-gray-200' : 'text-white'}`}>Live History</span>
        </div>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={HiChat} title="Total Messages" value={totalMessages} color="white" darkMode={darkMode} />
          <StatCard icon={HiArchive} title="Total Backups" value={totalBackups} color="white" darkMode={darkMode} />
          <StatCard icon={HiTrendingUp} title="Messages Today" value={stats.messages_today || 0} color="white" darkMode={darkMode} />
          <StatCard icon={HiDatabase} title="Backup Ratio" value={`${backupRatio}%`} color="white" darkMode={darkMode} />
        </div>
      )}
      </div>
      {/* Search & Filters Container */}
      <div className={`rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        
        {/* Search Bar */}
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="relative">
            <HiSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'} text-sm`} />
            <input
              type="text"
              placeholder="Search messages by content or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
              }`}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-all ${
                  darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                }`}
              >
                <HiX size={14} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
              </button>
            )}
          </div>
        </div>
        
        {/* Filter Tabs */}
        <div className="p-4">
          <div className="flex flex-wrap gap-2 mb-4">
          
            
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : `${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`
              }`}
            >
              <HiStar size={16} />
              <span className="text-sm">All Messages</span>
            </button>
            
            <button
              onClick={() => setFilter('withBackups')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                filter === 'withBackups'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : `${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`
              }`}
            >
              <HiArchive size={16} />
              <span className="text-sm">With Backups</span>
            </button>
            
            <button
              onClick={() => setFilter('noBackups')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                filter === 'noBackups'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : `${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`
              }`}
            >
              <HiCalendar size={16} />
              <span className="text-sm">No Backups</span>
            </button>

              <SortDropdown
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={(newSortBy, newSortOrder) => {
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
              darkMode={darkMode}
            />
            
            <label className={`flex items-center gap-2 ml-2 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={showDeleted}
                  onChange={(e) => setShowDeleted(e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`w-10 h-5 rounded-full transition-all duration-200 ${
                  showDeleted 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                    : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                }`}>
                  <div className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                    showDeleted ? 'translate-x-5' : 'translate-x-0'
                  }`}></div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Deleted messages
                </span>
              </div>
            </label>
          </div>
          
          <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-2 ml-1`}>
            {filteredMessages.length} {filteredMessages.length === 1 ? 'message' : 'messages'} found
            {searchTerm && ` for "${searchTerm}"`}
          </div>
        </div>
      </div>

      {/* Messages & Backups Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages List */}
        <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`px-5 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'} flex items-center justify-center`}>
                <HiChat className={`text-lg ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Messages Timeline</h3>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {loadingMessages ? 'Loading...' : `${filteredMessages.length} messages found`}
                </p>
              </div>
            </div>
          </div>
          
          <div className="max-h-[500px] overflow-y-auto p-4 space-y-2">
            {loadingMessages ? (
              <LoadingSpinner darkMode={darkMode} />
            ) : filteredMessages.length === 0 ? (
              <EmptyState 
                icon={HiChat} 
                title="No messages found" 
                message="Try adjusting your search or filters"
                darkMode={darkMode}
              />
            ) : (
              filteredMessages.map((msg) => (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  isSelected={selectedMessage?.id === msg.id}
                  onClick={fetchBackups}
                  darkMode={darkMode}
                />
              ))
            )}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            darkMode={darkMode}
          />
        </div>
        
        {/* Backups List */}
        <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`px-5 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${darkMode ? 'bg-purple-500/20' : 'bg-purple-100'} flex items-center justify-center`}>
                <HiArchive className={`text-lg ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <div>
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Backups & Restore</h3>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {selectedMessage ? `${backups.length} versions available` : 'Select a message to view backups'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="max-h-[500px] overflow-y-auto p-4">
            {loading ? (
              <LoadingSpinner darkMode={darkMode} />
            ) : restoring ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-3"></div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Restoring message...</p>
              </div>
            ) : selectedMessage ? (
              <>
                <div className={`mb-4 p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        {selectedMessage.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Current version by {selectedMessage.username}
                    </p>
                    {selectedMessage.is_deleted && (
                      <span className="text-xs text-red-500 flex items-center gap-1 ml-2">
                        <HiTrash size={10} /> Deleted
                      </span>
                    )}
                  </div>
                  {selectedMessage.is_deleted ? (
                    <p className="text-red-500 italic text-sm">[Message has been deleted]</p>
                  ) : (
                    <p className={`text-sm break-words whitespace-pre-wrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {selectedMessage.content}
                    </p>
                  )}
                </div>
                
                {backups.length === 0 ? (
                  <EmptyState 
                    icon={HiArchive} 
                    title="No backups available" 
                    message="This message has no saved versions"
                    darkMode={darkMode}
                  />
                ) : (
                  <div className="space-y-3">
                    <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} mb-2 flex items-center gap-1`}>
                      <HiClock size={10} /> Previous versions (click Restore to revert)
                    </div>
                    {backups.map((backup) => (
                      <BackupItem
                        key={backup.id}
                        backup={backup}
                        onRestore={handleRestore}
                        darkMode={darkMode}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <EmptyState 
                icon={HiRefresh} 
                title="No message selected" 
                message="Click on any message to view its backups"
                darkMode={darkMode}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimeTravel;