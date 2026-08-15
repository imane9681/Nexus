import React, { useState, useEffect } from 'react';
import { 
  HiPlus, HiHashtag, HiChat, HiSparkles, HiChip, HiMusicNote, 
  HiOutlineUsers, HiOutlineCog, HiChevronDown, HiChevronRight,
  HiChartBar, HiClipboardList, HiCalendar, HiFolder, HiDocumentText, HiClock,
  HiChevronLeft, HiTrash, HiX
} from 'react-icons/hi';
import { TbLayoutDashboardFilled } from "react-icons/tb";

function Sidebar({ 
  token, currentRoom, onJoinRoom, socket, darkMode, 
  onOpenMembers, onOpenSettings,
  showDashboard, setShowDashboard,
  showTasks, setShowTasks,
  showCalendar, setShowCalendar,
  showFileManager, setShowFileManager,
  showReports, setShowReports,
  showTimeTravel, setShowTimeTravel,
  onOpenCreateModal,
  onCollapseChange,
  onDeleteRoom,
  refreshRooms,
  rooms  // ✅ now coming from App.js
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [error, setError] = useState('');
  const [channelsExpanded, setChannelsExpanded] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const PROTECTED_ROOMS = ['general', 'random', 'tech', 'gaming'];

  useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(isCollapsed);
    }
  }, [isCollapsed, onCollapseChange]);

  // ✅ createRoom - no local setRooms, just call refreshRooms from App
  const createRoomLocal = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newRoomName, description: newRoomDesc })
      });
      const data = await response.json();
      if (response.ok) {
        setShowCreateModal(false);
        setNewRoomName('');
        setNewRoomDesc('');
        
        // ✅ Use refreshRooms from App to update the rooms list
        if (refreshRooms) {
          await refreshRooms();
        }
        
        if (data.id && onJoinRoom) {
          onJoinRoom(data.id);
        }
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Connection error');
    }
  };

  const handleDeleteRoom = async (roomId, roomName) => {
    if (onDeleteRoom) {
      await onDeleteRoom(roomId, roomName);
    }
  };

  const getRoomIcon = (name) => {
    const icons = {
      general: <HiChat size={18} />,
      random: <HiSparkles size={18} />,
      tech: <HiChip size={18} />,
      gaming: <HiMusicNote size={18} />
    };
    return icons[name] || <HiHashtag size={18} />;
  };

  const openFeature = (featureSetter, otherFeatures) => {
    if (otherFeatures) {
      otherFeatures.forEach(setter => {
        if (setter) setter(false);
      });
    }
    if (featureSetter) featureSetter(true);
  };

  const allFeatures = [
    setShowDashboard, setShowTasks, setShowCalendar, 
    setShowFileManager, setShowReports, setShowTimeTravel
  ];

  const colors = {
    bg: darkMode ? '#0F172A' : '#FFFFFF',
    bgHover: darkMode ? '#1E293B' : '#F1F5F9',
    bgActive: darkMode ? '#1E293B' : '#EFF6FF',
    border: darkMode ? '#1E293B' : '#E2E8F0',
    borderLight: darkMode ? '#334155' : '#CBD5E1',
    text: darkMode ? '#F1F5F9' : '#0F172A',
    textSecondary: darkMode ? '#94A3B8' : '#64748B',
    textMuted: darkMode ? '#475569' : '#94A3B8',
    accent: '#3B82F6',
    accentLight: darkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
    gradientStart: '#3B82F6',
    gradientEnd: '#8B5CF6'
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: TbLayoutDashboardFilled, setter: setShowDashboard, active: showDashboard },
    { id: 'tasks', label: 'Tasks', icon: HiClipboardList, setter: setShowTasks, active: showTasks },
    { id: 'calendar', label: 'Calendar', icon: HiCalendar, setter: setShowCalendar, active: showCalendar },
    { id: 'files', label: 'File Manager', icon: HiFolder, setter: setShowFileManager, active: showFileManager },
    { id: 'reports', label: 'Reports', icon: HiDocumentText, setter: setShowReports, active: showReports },
    { id: 'timetravel', label: 'Time Travel', icon: HiClock, setter: setShowTimeTravel, active: showTimeTravel }
  ];

  return (
    <>
      <div 
        className={`h-screen flex flex-col shadow-xl transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
        style={{ 
          backgroundColor: colors.bg,
          borderRight: `1px solid ${colors.border}`
        }}
      >
        <div className="px-4 py-5 relative flex-shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${colors.gradientStart}, ${colors.gradientEnd})`
                }}
              >
                <span className="text-white font-bold text-sm">NX</span>
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight" style={{ color: colors.text }}>
                  Nexus
                </h1>
                <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: colors.textSecondary }}>
                  Premium Workspace
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${colors.gradientStart}, ${colors.gradientEnd})`
                }}
              >
                <span className="text-white font-bold text-sm">NX</span>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
            style={{
              backgroundColor: colors.bg,
              border: `1px solid ${colors.border}`,
              color: colors.textSecondary
            }}
          >
            <HiChevronLeft 
              size={14} 
              className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        <div className={`h-px flex-shrink-0 ${darkMode ? 'bg-gradient-to-r from-transparent via-gray-700 to-transparent' : 'bg-gradient-to-r from-transparent via-gray-300 to-transparent'}`} />

        <div className="px-5 pt-4 pb-3 flex-shrink-0">
          {!isCollapsed && (
            <p className="text-[11px] font-semibold uppercase tracking-wider px-3 mb-3" style={{ color: colors.textSecondary }}>
              Applications
            </p>
          )}
          
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.active;
              
              return (
                <button
                  key={item.id}
                  onClick={() => openFeature(item.setter, allFeatures)}
                  className={`w-full flex items-center transition-all duration-200 rounded-xl group ${
                    isCollapsed ? 'justify-center px-0 py-3' : 'px-3 py-3 gap-3'
                  } ${isActive ? 'relative' : ''}`}
                  style={{
                    backgroundColor: isActive ? colors.accentLight : 'transparent',
                    color: isActive ? colors.accent : colors.textSecondary
                  }}
                >
                  {isActive && !isCollapsed && (
                    <div className="absolute -left-1.5 w-1 h-8 rounded-r-full" style={{ backgroundColor: colors.accent }} />
                  )}
                  <Icon size={20} />
                  {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg pointer-events-none"
                      style={{ backgroundColor: '#1E293B', color: '#FFFFFF', fontSize: '12px' }}
                    >
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className={`h-px flex-shrink-0 ${darkMode ? 'bg-gradient-to-r from-transparent via-gray-700 to-transparent' : 'bg-gradient-to-r from-transparent via-gray-300 to-transparent'}`} />

        <div className="px-5 pt-4 pb-3 flex-shrink-0">
          {!isCollapsed && (
            <p className="text-[11px] font-semibold uppercase tracking-wider px-3 mb-3" style={{ color: colors.textSecondary }}>
              Workspace
            </p>
          )}
          
          <div className="space-y-1">
            <button
              onClick={() => onOpenMembers && onOpenMembers(currentRoom)}
              className={`w-full flex items-center transition-all duration-200 rounded-xl group ${
                isCollapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5 gap-3'
              }`}
              style={{ color: colors.textSecondary }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bgHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <HiOutlineUsers size={20} />
              {!isCollapsed && <span className="text-sm font-medium">Members</span>}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg"
                  style={{ backgroundColor: '#1E293B', color: '#FFFFFF', fontSize: '12px' }}
                >
                  Members
                </div>
              )}
            </button>
            
            <button
              onClick={() => onOpenSettings && onOpenSettings()}
              className={`w-full flex items-center transition-all duration-200 rounded-xl group ${
                isCollapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5 gap-3'
              }`}
              style={{ color: colors.textSecondary }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bgHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <HiOutlineCog size={20} />
              {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg"
                  style={{ backgroundColor: '#1E293B', color: '#FFFFFF', fontSize: '12px' }}
                >
                  Settings
                </div>
              )}
            </button>
          </div>
        </div>

        <div className={`h-px flex-shrink-0 ${darkMode ? 'bg-gradient-to-r from-transparent via-gray-700 to-transparent' : 'bg-gradient-to-r from-transparent via-gray-300 to-transparent'}`} />

        <div className="px-5 pt-4 flex-shrink-0">
          <div className="px-3 py-1.5">
            <button 
              onClick={() => setChannelsExpanded(!channelsExpanded)} 
              className="w-full flex items-center justify-between group"
            >
              <div className="flex items-center gap-1.5">
                {!isCollapsed && (
                  channelsExpanded ? (
                    <HiChevronDown size={12} style={{ color: colors.textSecondary }} />
                  ) : (
                    <HiChevronRight size={12} style={{ color: colors.textSecondary }} />
                  )
                )}
                {!isCollapsed && (
                  <span className="text-[11px] font-semibold uppercase tracking-wider transition-colors group-hover:text-blue-500" style={{ color: colors.textSecondary }}>
                    Text Channels ({rooms.length})
                  </span>
                )}
                {isCollapsed && (
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation();  
                      onOpenCreateModal(); 
                    }}
                    className="-ml-2 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-105"
                    style={{ color: colors.textSecondary }}
                  >
                    <HiPlus size={18} />
                  </button>
                )}
              </div>
              {!isCollapsed && (
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onOpenCreateModal(); 
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-all p-1 rounded-md"
                  style={{ color: colors.textSecondary }}
                >
                  <HiPlus size={14} />
                </button>
              )}
            </button>
          </div>
        </div>

        <div 
          className="flex-1 px-5 pb-2 overflow-y-auto custom-scrollbar max-h-48"
          
        >
          {channelsExpanded && !isCollapsed && (
            <div className="mt-2 space-y-0.5">
              {rooms.map((room) => {
                const isActive = currentRoom === room.id;
                const isProtected = PROTECTED_ROOMS.includes(room.name);
                
                return (
                  <div key={room.id} className="relative group">
                    <button
                      onClick={() => onJoinRoom(room.id)}
                      className="w-full text-left px-3 py-2 rounded-xl transition-all duration-200 flex items-center justify-between"
                      style={{
                        backgroundColor: isActive ? colors.accentLight : 'transparent',
                        color: isActive ? colors.accent : colors.textSecondary
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = colors.bgHover;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <span className="flex-shrink-0">{getRoomIcon(room.name)}</span>
                        <span className="text-sm font-medium truncate">{room.name}</span>
                      </div>
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors.accent }} />
                      )}
                    </button>
                    
                    {!isProtected && onDeleteRoom && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRoom(room.id, room.name);
                        }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all duration-200 hover:bg-red-500/20"
                        title="Delete room"
                      >
                        <HiTrash size={12} className="text-red-400 hover:text-red-500" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {isCollapsed && (
            <div className="mt-1 space-y-0.5">
              {rooms.map((room) => {
                const isActive = currentRoom === room.id;
                
                return (
                  <button
                    key={room.id}
                    onClick={() => onJoinRoom(room.id)}
                    className="w-full flex justify-center px-3 py-3 rounded-xl transition-all duration-200 group relative"
                    style={{
                      backgroundColor: isActive ? colors.accentLight : 'transparent',
                      color: isActive ? colors.accent : colors.textSecondary
                    }}
                  >
                    <span>{getRoomIcon(room.name)}</span>
                    <div className="absolute left-full ml-2 px-2 py-1 rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg"
                      style={{ backgroundColor: '#1E293B', color: '#FFFFFF', fontSize: '12px' }}
                    >
                      {room.name}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] backdrop-blur-sm">
          <div className={`rounded-2xl p-6 w-96 shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Create Channel</h3>
              <button onClick={() => setShowCreateModal(false)} className={`p-1 rounded-lg transition-all ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                <HiX size={18} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
              </button>
            </div>
            <form onSubmit={createRoomLocal}>
              <input
                type="text"
                placeholder="Channel name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value.toLowerCase())}
                className={`w-full px-4 py-2 rounded-xl mb-3 border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                required
                autoFocus
              />
              <textarea
                placeholder="Description (optional)"
                value={newRoomDesc}
                onChange={(e) => setNewRoomDesc(e.target.value)}
                className={`w-full px-4 py-2 rounded-xl mb-3 border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                rows="3"
              />
              {error && <div className="text-red-500 text-sm mb-3">{error}</div>}
              <div className="flex gap-3">
                <button type="submit" className="flex-1 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium transition-all hover:shadow-lg">
                  Create
                </button>
                <button type="button" onClick={() => setShowCreateModal(false)} className={`flex-1 py-2 rounded-xl font-medium transition-all ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${darkMode ? '#334155' : '#CBD5E1'};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${darkMode ? '#475569' : '#94A3B8'};
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: ${darkMode ? '#334155' : '#CBD5E1'} transparent;
        }
      `}</style>
    </>
  );
}

export default Sidebar;