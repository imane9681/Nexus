import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { 
  HiLogout, HiTrash, HiPaperAirplane, 
  HiSearch, HiMenu, HiX, HiChat, HiSun, HiMoon, 
  HiUserCircle, HiEmojiHappy, HiPaperClip, HiGif,
  HiMicrophone, HiPlusCircle, HiPhotograph, HiSparkles,
  HiDownload, HiDocument, HiEye
} from 'react-icons/hi';
import Login from './components/Login';
import TimeTravel from './components/TimeTravel';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import TasksPanel from './components/TasksPanel';
import NotificationBell from './components/NotificationBell';
import Calendar from './components/Calendar';
import FileManager from './components/FileManager';
import ReportsPanel from './components/ReportsPanel';
import MembersModal from './components/MembersModal';
import SettingsModal from './components/SettingsModal';
import Picker from 'emoji-picker-react';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [token, setToken] = useState(sessionStorage.getItem('token') || '');
  const [socket, setSocket] = useState(null);
  const [showTimeTravel, setShowTimeTravel] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(1);
  const [rooms, setRooms] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [showTasks, setShowTasks] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showFileManager, setShowFileManager] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedRoomForMembers, setSelectedRoomForMembers] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [error, setError] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // State للأزرار
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  
  // State للملفات المرفوعة وعرض الصور
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [previewImage, setPreviewImage] = useState(null);

  const PROTECTED_ROOMS = ['general', 'random', 'tech', 'gaming'];

  // ✅ دالة لإضافة الإيموجي
  const onEmojiClick = (emojiObject) => {
    setInput(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  // ✅ دالة رفع ملف
  const handleFileUpload = async (event, type = 'file') => {
    const file = event.target.files[0];
    if (!file) return;

    // التحقق من حجم الملف (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('room_id', currentRoom);

    try {
      const response = await fetch('http://localhost:5000/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const fileData = await response.json();
        
        // تخزين معلومات الملف
        const fileInfo = {
          id: fileData.id,
          name: file.name,
          type: file.type,
          size: file.size,
          url: `http://localhost:5000/api/files/${fileData.id}/download?token=${token}`
        };
        
        setUploadedFiles(prev => ({
          ...prev,
          [fileData.id]: fileInfo
        }));
        
        // إرسال رسالة خاصة بالملف
        const fileMessage = JSON.stringify({
          type: type === 'image' ? 'image' : 'file',
          fileId: fileData.id,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        });
        
        if (socket?.connected) {
          socket.emit('chat-message', { text: fileMessage, roomId: currentRoom });
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Upload failed');
    }
    
    setShowFileMenu(false);
    event.target.value = '';
  };

  // ✅ دالة تنسيق حجم الملف
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // ✅ دالة عرض الملفات والصور
  const renderFileMessage = (content, darkMode) => {
    // التحقق إذا كانت الرسالة تحتوي على ملف
    if (typeof content === 'string' && content.startsWith('{') && content.includes('fileId')) {
      try {
        const fileData = JSON.parse(content);
        const fileInfo = uploadedFiles[fileData.fileId] || {
          ...fileData,
          url: `http://localhost:5000/api/files/${fileData.fileId}/download?token=${token}`
        };
        
        const isImage = fileInfo.fileType?.startsWith('image/') || fileData.fileType?.startsWith('image/');
        
        if (isImage) {
          return (
            <div className="mt-2">
              <div 
                className="relative group cursor-pointer rounded-lg overflow-hidden inline-block"
                onClick={() => setPreviewImage(fileInfo.url)}
              >
                <img 
                  src={fileInfo.url} 
                  alt={fileInfo.fileName || fileData.fileName}
                  className="max-w-xs max-h-48 rounded-lg hover:opacity-90 transition-all object-cover"
                  style={{ maxWidth: '300px', maxHeight: '200px' }}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                  }}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); window.open(fileInfo.url, '_blank'); }}
                    className="p-2 bg-white rounded-full hover:scale-110 transition"
                  >
                    <HiDownload size={16} className="text-gray-800" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setPreviewImage(fileInfo.url); }}
                    className="p-2 bg-white rounded-full hover:scale-110 transition"
                  >
                    <HiEye size={16} className="text-gray-800" />
                  </button>
                </div>
              </div>
            </div>
          );
        }
        
        return (
          <div 
            className={`mt-2 flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:shadow-md ${darkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
            onClick={() => window.open(fileInfo.url, '_blank')}
          >
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
              <HiDocument size={24} className="text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {fileInfo.fileName || fileData.fileName}
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {formatFileSize(fileInfo.fileSize || fileData.fileSize)} • Click to download
              </p>
            </div>
            <HiDownload size={18} className="text-gray-400 flex-shrink-0" />
          </div>
        );
      } catch (e) {
        // ليست رسالة ملف صالحة
        return renderTextMessage(content, darkMode);
      }
    }
    
    return renderTextMessage(content, darkMode);
  };

  // ✅ دالة معالجة النصوص والروابط
  const renderTextMessage = (content, darkMode) => {
    // معالجة الروابط
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    
    return (
      <div className="break-words whitespace-pre-wrap max-w-full">
        {parts.map((part, index) => {
          if (part && part.match(urlRegex)) {
            return (
              <a
                key={index}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 underline break-all inline-block"
                onClick={(e) => e.stopPropagation()}
              >
                {part.length > 50 ? part.substring(0, 50) + '...' : part}
              </a>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </div>
    );
  };

  const refreshRooms = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/rooms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setRooms(data);
      return data;
    } catch (error) {
      console.error('Error refreshing rooms:', error);
      return [];
    }
  };

  const createRoom = async (e) => {
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
        setRooms(prevRooms => [...prevRooms, data]);
        setShowCreateModal(false);
        setNewRoomName('');
        setNewRoomDesc('');
        
        if (data.id) {
          joinRoom(data.id);
        }
        setTimeout(() => refreshRooms(), 500);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Connection error');
    }
  };

  const deleteRoom = async (roomId, roomName) => {
    if (PROTECTED_ROOMS.includes(roomName)) {
      alert('❌ Cannot delete default rooms (general, random, tech, gaming)!');
      return false;
    }
    
    const confirmed = window.confirm(
      `⚠️ Delete "#${roomName}"?\n\n` +
      `• All messages will be moved to #general\n` +
      `• All tasks related to this room will be moved\n` +
      `• This action cannot be undone\n\n` +
      `Are you sure?`
    );
    
    if (!confirmed) return false;
    
    try {
      const response = await fetch(`http://localhost:5000/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setRooms(prevRooms => prevRooms.filter(room => room.id !== roomId));
        if (currentRoom === roomId) {
          joinRoom(1);
        }
        setTimeout(() => refreshRooms(), 500);
        alert(data.message);
        return true;
      } else {
        alert(data.error || 'Failed to delete room');
        return false;
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('Connection error. Please try again.');
      return false;
    }
  };

  const fetchUserInfo = async (authToken) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (response.ok) {
        const user = await response.json();
        setCurrentUser(user);
        setIsAuthenticated(true);
        await refreshRooms();
      } else {
        sessionStorage.removeItem('token');
        setToken('');
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  const fetchMessages = async (roomId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/rooms/${roomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
        if (socket) {
          socket.emit('delete-message', { messageId, roomId: currentRoom });
        }
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const joinRoom = (roomId) => {
    setShowDashboard(false);
    setShowTasks(false);
    setShowCalendar(false);
    setShowFileManager(false);
    setShowReports(false);
    setShowTimeTravel(false);
    
    if (socket && socket.connected) {
      socket.emit('join-room', { roomId, previousRoomId: currentRoom });
      setCurrentRoom(roomId);
      fetchMessages(roomId);
    }
  };

  const openMembersModal = (roomId) => {
    setSelectedRoomForMembers(roomId);
    setShowMembersModal(true);
  };

  const openSettingsModal = () => {
    setShowSettingsModal(true);
  };

  const handleThemeChange = () => {
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    if (token) {
      fetchUserInfo(token);
    }
    return () => {
      if (socket) socket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (isAuthenticated && token && !socket) {
      const newSocket = io('http://localhost:5000', {
        auth: { token },
        transports: ['websocket']
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        newSocket.emit('join-room', { roomId: currentRoom });
      });

      newSocket.on('disconnect', () => setIsConnected(false));

      newSocket.on('new-message', (msg) => {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, { ...msg, content: msg.content || msg.text, user_id: msg.user_id || msg.userId }];
        });
      });

      newSocket.on('message-deleted', ({ messageId }) => {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      });

      newSocket.on('message-restored', (data) => {
        console.log('Message restored:', data);
        setMessages(prev => {
          const existingIndex = prev.findIndex(msg => msg.id === data.messageId);
          if (existingIndex !== -1) {
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              content: data.restoredContent,
              is_deleted: false,
              isRestored: true
            };
            return updated;
          }
          return prev;
        });
      });

      newSocket.on('room-joined', ({ roomId }) => fetchMessages(roomId));
      
      newSocket.on('room-deleted', ({ roomId, defaultRoomId }) => {
        if (currentRoom === roomId) {
          joinRoom(defaultRoomId);
        }
        refreshRooms();
      });

      setSocket(newSocket);
      return () => newSocket.disconnect();
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentRoom]);

  // إغلاق القوائم عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
      if (!e.target.closest('.file-menu-container')) {
        setShowFileMenu(false);
      }
      if (!e.target.closest('.gif-picker-container')) {
        setShowGifPicker(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleNavigate = (type, id, messageId) => {
    if (type === 'tasks') {
      setShowTasks(true);
      setShowDashboard(false);
      setShowTimeTravel(false);
      setShowCalendar(false);
      setShowFileManager(false);
      setShowReports(false);
    } else if (type === 'room' && id) {
      setShowTasks(false);
      setShowDashboard(false);
      setShowTimeTravel(false);
      setShowCalendar(false);
      setShowFileManager(false);
      setShowReports(false);
      joinRoom(id);
    }
  };

  const handleLogin = async (username, password) => {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    sessionStorage.setItem('token', data.token);
    setToken(data.token);
    setCurrentUser(data.user);
    setIsAuthenticated(true);
  };

  const handleRegister = async (username, email, password) => {
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    sessionStorage.setItem('token', data.token);
    setToken(data.token);
    setCurrentUser(data.user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    if (socket) socket.disconnect();
    sessionStorage.removeItem('token');
    setToken('');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setMessages([]);
    setShowDashboard(false);
    setShowTasks(false);
    setShowCalendar(false);
    setShowFileManager(false);
    setShowReports(false);
    setShowTimeTravel(false);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim() && socket?.connected) {
      socket.emit('chat-message', { text: input, roomId: currentRoom });
      setInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const filteredMessages = messages.filter(msg =>
    msg.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} onRegister={handleRegister} isConnected={isConnected} />;
  }

  const currentRoomName = rooms.find(r => r.id === currentRoom)?.name || 'general';

  const theme = {
    bg: darkMode ? 'bg-gray-900' : 'bg-gray-50',
    card: darkMode ? 'bg-gray-800' : 'bg-white',
    text: darkMode ? 'text-white' : 'text-gray-900',
    textSecondary: darkMode ? 'text-gray-400' : 'text-gray-500',
    border: darkMode ? 'border-gray-700' : 'border-gray-200',
    input: darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-100 text-gray-900 border-gray-300',
    inputPlaceholder: darkMode ? 'placeholder-gray-400' : 'placeholder-gray-500',
    messageUser: darkMode ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-blue-500 to-blue-600',
    messageOther: darkMode ? 'bg-gray-700' : 'bg-gray-100',
    hover: darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
  };

  const sidebarWidth = sidebarCollapsed ? 80 : 288;
  const mainMarginLeft = sidebarOpen ? sidebarWidth : 0;

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text}`}>
      {/* Modal لعرض الصورة مكبرة */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <img 
            src={previewImage} 
            alt="Preview"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
          />
          <button 
            className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition"
            onClick={() => setPreviewImage(null)}
          >
            <HiX size={24} className="text-white" />
          </button>
        </div>
      )}

      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white shadow-lg hover:shadow-xl transition-all duration-200"
      >
        {sidebarOpen ? <HiX size={20} /> : <HiMenu size={20} />}
      </button>

      <div className={`fixed top-0 left-0 z-40 h-full transition-all duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar 
          token={token} 
          currentRoom={currentRoom} 
          onJoinRoom={joinRoom} 
          socket={socket} 
          darkMode={darkMode}
          onOpenMembers={openMembersModal}
          onOpenSettings={openSettingsModal}
          showDashboard={showDashboard}
          setShowDashboard={setShowDashboard}
          showTasks={showTasks}
          setShowTasks={setShowTasks}
          showCalendar={showCalendar}
          setShowCalendar={setShowCalendar}
          showFileManager={showFileManager}
          setShowFileManager={setShowFileManager}
          showReports={showReports}
          setShowReports={setShowReports}
          showTimeTravel={showTimeTravel}
          setShowTimeTravel={setShowTimeTravel}
          onOpenCreateModal={() => setShowCreateModal(true)}
          onCollapseChange={setSidebarCollapsed}
          onDeleteRoom={deleteRoom}
          refreshRooms={refreshRooms}
          rooms={rooms}
        />
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] backdrop-blur-sm">
          <div 
            className="rounded-2xl p-6 w-96 shadow-2xl animate-modal-pop"
            style={{ 
              backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
              border: `1px solid ${darkMode ? '#1E293B' : '#E2E8F0'}`
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold" style={{ color: darkMode ? '#F1F5F9' : '#0F172A' }}>
                Create Channel
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg transition-all hover:scale-110"
                style={{ color: darkMode ? '#94A3B8' : '#64748B' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={createRoom}>
              <input
                type="text"
                placeholder="Channel name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value.toLowerCase())}
                className="w-full px-4 py-2.5 rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                style={{
                  backgroundColor: darkMode ? '#1E293B' : '#F1F5F9',
                  color: darkMode ? '#F1F5F9' : '#0F172A',
                  border: `1px solid ${darkMode ? '#1E293B' : '#E2E8F0'}`
                }}
                required
                autoFocus
              />
              <textarea
                placeholder="Description (optional)"
                value={newRoomDesc}
                onChange={(e) => setNewRoomDesc(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all"
                style={{
                  backgroundColor: darkMode ? '#1E293B' : '#F1F5F9',
                  color: darkMode ? '#F1F5F9' : '#0F172A',
                  border: `1px solid ${darkMode ? '#1E293B' : '#E2E8F0'}`
                }}
                rows="3"
              />
              {error && (
                <div className="text-red-500 text-sm mb-3">{error}</div>
              )}
              <div className="flex gap-3">
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2.5 rounded-xl font-medium transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: `linear-gradient(135deg, #3B82F6, #8B5CF6)`,
                    color: 'white'
                  }}
                >
                  Create
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowCreateModal(false);
                    setError('');
                    setNewRoomName('');
                    setNewRoomDesc('');
                  }} 
                  className="flex-1 px-4 py-2.5 rounded-xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    backgroundColor: darkMode ? '#1E293B' : '#F1F5F9',
                    color: darkMode ? '#94A3B8' : '#64748B'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main 
        className="flex-1 flex flex-col h-screen transition-all duration-300"
        style={{ marginLeft: `${mainMarginLeft}px` }}
      >
        <div className={`${theme.card} border-b ${theme.border} sticky top-0 z-10 shadow-sm backdrop-blur-sm bg-opacity-95`}>
          <div className="flex justify-between items-center px-4 md:px-6 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
              >
                <HiMenu size={20} />
              </button>
              <div>
                <h1 className={`text-xl font-bold flex items-center gap-2 ${theme.text}`}>
                  {currentRoomName === 'general' ? 'General' : currentRoomName}
                </h1>
                <p className={`text-xs ${theme.textSecondary} flex items-center gap-1`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  {filteredMessages.length} messages • {isConnected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <div className="relative hidden md:block">
                <HiSearch size={18} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme.textSecondary}`} />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-9 pr-4 py-2 ${theme.input} rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 lg:w-64 transition-all ${theme.inputPlaceholder}`}
                />
              </div>

              <button 
                onClick={() => setDarkMode(!darkMode)} 
                className={`p-2 rounded-xl ${theme.hover} transition-all duration-300 hover:scale-110`}
              >
                {darkMode ? <HiSun size={20} className="text-yellow-400" /> : <HiMoon size={20} />}
              </button>

              <NotificationBell token={token} darkMode={darkMode} onNavigate={handleNavigate} />

              <div className="relative">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)} 
                  className={`p-1 rounded-full ${theme.hover} transition-all duration-200`}
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white font-semibold text-sm">
                      {currentUser?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </button>
                
                {showProfileMenu && (
                  <div className={`absolute right-0 mt-2 w-56 ${theme.card} rounded-xl shadow-xl border ${theme.border} z-50 animate-fade-in`}>
                    <div className={`p-3 border-b ${theme.border}`}>
                      <p className={`font-semibold ${theme.text}`}>{currentUser?.username}</p>
                      <p className={`text-xs ${theme.textSecondary}`}>{currentUser?.email}</p>
                    </div>
                    <button 
                      onClick={handleLogout} 
                      className={`w-full text-left px-4 py-3 ${theme.hover} text-red-500 rounded-b-xl flex items-center gap-2 transition-all duration-200`}
                    >
                      <HiLogout size={18} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {showMembersModal && (
          <MembersModal
            token={token}
            roomId={selectedRoomForMembers}
            darkMode={darkMode}
            onClose={() => setShowMembersModal(false)}
          />
        )}

        {showSettingsModal && (
          <SettingsModal
            token={token}
            darkMode={darkMode}
            onClose={() => setShowSettingsModal(false)}
            onThemeChange={handleThemeChange}
          />
        )}

        <div className="flex-1 overflow-hidden">
          {showReports ? (
            <div className="h-full overflow-y-auto p-4">
              <ReportsPanel token={token} darkMode={darkMode} />
            </div>
          ) : showFileManager ? (
            <div className="h-full overflow-y-auto p-4">
              <FileManager token={token} darkMode={darkMode} />
            </div>
          ) : showCalendar ? (
            <div className="h-full overflow-y-auto p-4">
              <Calendar token={token} darkMode={darkMode} />
            </div>
          ) : showTasks ? (
            <div className="h-full overflow-y-auto p-4">
              <TasksPanel token={token} darkMode={darkMode} />
            </div>
          ) : showDashboard ? (
            <div className="h-full overflow-y-auto p-4 md:p-6">
              <Dashboard token={token} darkMode={darkMode} />
            </div>
          ) : showTimeTravel ? (
            <div className="h-full overflow-y-auto p-4 md:p-6">
              <TimeTravel 
                token={token} 
                darkMode={darkMode} 
                onRestore={() => { 
                  setShowTimeTravel(false); 
                  fetchMessages(currentRoom); 
                }}
                onBackToChat={() => {
                  setShowTimeTravel(false);
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-4 scrollbar-thin">
                {filteredMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl mb-4">
                      <HiChat className="text-white text-4xl" />
                    </div>
                    <p className={`text-xl font-medium ${theme.textSecondary} mt-2`}>No messages yet</p>
                    <p className={`text-sm ${theme.textSecondary} mt-1`}>
                      Be the first to send a message in #{currentRoomName}
                    </p>
                  </div>
                ) : (
                  filteredMessages.map((msg, idx) => {
                    const isOwn = msg.user_id === currentUser?.id;
                    const showAvatar = !isOwn && (idx === 0 || filteredMessages[idx - 1]?.user_id !== msg.user_id);
                    
                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex items-start gap-3 group animate-fade-in ${isOwn ? 'flex-row-reverse' : ''}`}
                      >
                        {!isOwn && showAvatar && (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 flex items-center justify-center shadow-md">
                            <span className="text-white font-semibold text-sm">
                              {msg.username?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        {!isOwn && !showAvatar && <div className="w-10 flex-shrink-0"></div>}
                        
                        <div className={`flex flex-col max-w-[85%] ${isOwn ? 'items-end' : 'items-start'}`}>
                          {!isOwn && showAvatar && (
                            <span className={`text-xs font-medium ${theme.textSecondary} mb-1 ml-1`}>
                              {msg.username}
                            </span>
                          )}
                          <div
                            className={`relative px-4 py-2.5 rounded-2xl shadow-sm transition-all duration-200 max-w-full ${
                              isOwn
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-md'
                                : `${theme.messageOther} ${theme.text} rounded-bl-md`
                            }`}
                          >
                            <div className="break-words text-sm md:text-base leading-relaxed max-w-full overflow-x-auto">
                              {renderFileMessage(msg.content, darkMode)}
                            </div>
                            <div className={`text-[10px] mt-1 ${isOwn ? 'text-blue-200' : theme.textSecondary}`}>
                              {formatTime(msg.created_at)}
                            </div>
                          </div>
                        </div>
                        
                        {isOwn && (
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10"
                          >
                            <HiTrash size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* منطقة إدخال الرسائل مع الأزرار العاملة */}
              <div className={`${theme.card} border-t ${theme.border} p-4 flex-shrink-0 shadow-lg relative`}>
                <form onSubmit={sendMessage} className="flex px-5 gap-3 items-center max-w-7xl mx-auto relative">
                  <div className="relative flex-1">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={`Message ${currentRoomName}...`}
                      rows="1"
                      className={`w-full px-4 py-3 ${theme.input} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputPlaceholder} transition-all resize-none`}
                      style={{ maxHeight: '120px' }}
                    />
                  </div>
                  
                  <div className="flex gap-1 relative">
                    {/* زر الإيموجي */}
                    <div className="relative emoji-picker-container">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowEmojiPicker(!showEmojiPicker);
                          setShowFileMenu(false);
                          setShowGifPicker(false);
                        }}
                        className="p-2.5 rounded-xl text-gray-400 hover:text-blue-500 transition-all duration-200 hover:scale-110"
                      >
                        <HiEmojiHappy size={20} />
                      </button>
                      {showEmojiPicker && (
                        <div className="absolute bottom-full mb-2 right-0 z-50" onClick={(e) => e.stopPropagation()}>
                          <Picker onEmojiClick={onEmojiClick} />
                        </div>
                      )}
                    </div>

                    {/* زر الملفات */}
                    <div className="relative file-menu-container">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowFileMenu(!showFileMenu);
                          setShowEmojiPicker(false);
                          setShowGifPicker(false);
                        }}
                        className="p-2.5 rounded-xl text-gray-400 hover:text-blue-500 transition-all duration-200 hover:scale-110"
                      >
                        <HiPaperClip size={18} />
                      </button>
                      {showFileMenu && (
                        <div className={`absolute w-40 bottom-full mb-2 right-0 rounded-xl shadow-lg border overflow-hidden z-50 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                          <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                          >
                            <HiPhotograph size={16} /> Upload Image
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                          >
                            <HiPaperClip size={16} /> Upload File
                          </button>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'file')}
                      />
                      <input
                        type="file"
                        ref={imageInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'image')}
                      />
                    </div>


                    {/* زر الإرسال */}
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className="p-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:cursor-not-allowed hover:scale-105"
                    >
                      <HiPaperAirplane size={18} className="transform rotate-90" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      {!sidebarOpen && searchQuery && (
        <div className="lg:hidden fixed bottom-20 left-4 right-4 z-40 animate-slide-up">
          <div className={`${theme.card} rounded-xl shadow-lg border ${theme.border} p-2`}>
            <div className="relative">
              <HiSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme.textSecondary}`} />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 ${theme.input} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.inputPlaceholder}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;