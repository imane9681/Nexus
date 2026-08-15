import React, { useState, useEffect } from 'react';
import { HiX, HiUserCircle, HiMail, HiCalendar, HiUsers, HiCheckCircle, HiClock } from 'react-icons/hi';

function MembersModal({ token, roomId, darkMode, onClose }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMembers();
  }, [roomId]);

  const fetchMembers = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/rooms/${roomId}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(member =>
    member.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onlineCount = members.filter(m => m.is_online).length;
  const offlineCount = members.filter(m => !m.is_online).length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className={`rounded-2xl w-[450px] max-w-full shadow-2xl animate-modal-pop ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex justify-between items-center p-5 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${
              darkMode ? 'bg-blue-500/20' : 'bg-blue-100'
            } flex items-center justify-center`}>
              <HiUsers className={`text-lg ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Room Members
              </h3>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {members.length} members • {onlineCount} online
              </p>
            </div>
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
        
        {/* Search Bar */}
        <div className={`p-4 border-b ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
          <div className="relative">
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-4 pr-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>
        </div>
        
        {/* Members List */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                darkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <HiUsers className={`text-2xl ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <p className="text-sm">No members found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredMembers.map(member => (
                <div key={member.id} className={`p-3 rounded-xl transition-all duration-200 ${
                  darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm`}>
                      <span className="text-white text-sm font-medium">
                        {member.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {member.username}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          member.is_online 
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                        }`}>
                          {member.is_online ? (
                            <>
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                              Online
                            </>
                          ) : (
                            <>
                              <HiClock size={10} />
                              Offline
                            </>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1">
                          <HiMail size={10} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {member.email}
                          </span>
                        </div>
                      </div>
                      {member.last_seen && !member.is_online && (
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-1 flex items-center gap-1`}>
                          <HiCalendar size={10} />
                          Last seen: {new Date(member.last_seen).toLocaleString()}
                        </p>
                      )}
                    </div>
                    {member.is_online && (
                      <HiCheckCircle size={16} className="text-emerald-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer Stats */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'} flex justify-between text-xs`}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{onlineCount} online</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{offlineCount} offline</span>
            </div>
          </div>
          <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>
            {filteredMembers.length} of {members.length} shown
          </span>
        </div>
      </div>
    </div>
  );
}

export default MembersModal;