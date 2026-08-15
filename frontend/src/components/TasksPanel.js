import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
  HiPlus, HiTrash, HiPencil, HiCheck, HiClock, 
  HiFlag, HiUser, HiCalendar, HiX, HiRefresh,
  HiClipboardList, HiInbox, HiCheckCircle, HiUserAdd,
  HiArchive, HiDownload, HiSearch, HiFilter,
  HiChevronLeft, HiChevronRight, HiChartBar,
  HiTrendingUp, HiSparkles, HiCalendar as HiCalendarIcon,
  HiSortAscending, HiSortDescending, HiStar,
  HiEye, HiEyeOff, HiCheck as HiCheckIcon,
  HiMenu, HiViewList, HiViewGrid, HiTag, HiPaperClip,
  HiChevronDown
} from 'react-icons/hi';

// ==================== Custom Select Component ====================
const CustomSelect = ({ value, onChange, options, placeholder, icon: Icon, darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={selectRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full py-2.5 px-5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all flex items-center justify-between ${
          darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
        }`}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={18} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />}
          <span className="truncate">{selectedOption?.label || placeholder}</span>
        </div>
        <HiChevronDown size={20} className={`ml-2 transition-transform ${isOpen ? 'rotate-180' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-500'} flex-shrink-0`} />
      </button>
      
      {isOpen && (
        <div className={`absolute z-50 w-full mt-1 rounded-xl border shadow-lg overflow-hidden ${
          darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
        }`}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left flex items-center gap-2 transition-colors ${
                value === option.value
                  ? 'bg-blue-500/20 text-blue-500'
                  : darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {option.icon && <option.icon size={14} className="flex-shrink-0" />}
              <span className="truncate">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

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

// ==================== Dropdown Menu Portal Component ====================
const DropdownMenu = ({ isOpen, onClose, children, anchorRef, darkMode }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  
  useEffect(() => {
    if (isOpen && anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const menuHeight = menuRef.current?.offsetHeight || 200;
      const windowHeight = window.innerHeight;
      let topPosition = rect.bottom + window.scrollY + 5;
      
      // إذا كانت القائمة ستخرج عن الشاشة من الأسفل، اعرضها للأعلى
      if (topPosition + menuHeight > windowHeight + window.scrollY) {
        topPosition = rect.top + window.scrollY - menuHeight - 5;
      }
      
      setPosition({
        top: topPosition,
        left: rect.right - 200 + window.scrollX,
      });
    }
  }, [isOpen, anchorRef]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && anchorRef.current && !anchorRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, anchorRef, onClose]);
  
  if (!isOpen) return null;
  
  return ReactDOM.createPortal(
    <div
      ref={menuRef}
      className={`fixed rounded-xl shadow-xl border overflow-hidden ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 99999,
        minWidth: '200px',
        maxWidth: '220px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}
    >
      {children}
    </div>,
    document.body
  );
};

// ==================== Component لبطاقة المهمة ====================
const TaskCard = ({ task, filter, onStatusChange, onArchive, onUnarchive, onSoftDelete, onRestore, onPermanentDelete, onEdit, darkMode }) => {
  const [showMenu, setShowMenu] = useState(false);
  const buttonRef = useRef(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'bg-blue-500/20 text-blue-400';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-400';
      case 'done': return 'bg-emerald-500/20 text-emerald-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'todo': return 'To Do';
      case 'in_progress': return 'In Progress';
      case 'done': return 'Done';
      default: return status;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/10';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10';
      case 'low': return 'text-emerald-400 bg-emerald-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <HiFlag className="text-red-400" size={12} />;
      case 'medium': return <HiStar className="text-yellow-400" size={12} />;
      case 'low': return <HiCheckCircle className="text-emerald-400" size={12} />;
      default: return <HiFlag className="text-gray-400" size={12} />;
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return priority;
    }
  };

  const isOverdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date();

  const handleCloseMenu = () => {
    setShowMenu(false);
  };

  const renderMenuContent = () => {
    if (filter === 'active') {
      return (
        <>
          <button onClick={() => { onStatusChange(task.id, 'todo'); handleCloseMenu(); }} 
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
              darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
            }`}>
            <HiCheckCircle size={14} className="text-blue-500" /> To Do
          </button>
          <button onClick={() => { onStatusChange(task.id, 'in_progress'); handleCloseMenu(); }} 
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
              darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
            }`}>                    
            <HiTrendingUp size={14} className="text-yellow-500" /> In Progress
          </button>
          <button onClick={() => { onStatusChange(task.id, 'done'); handleCloseMenu(); }} 
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
              darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
            }`}>                  
            <HiCheckIcon size={14} className="text-green-500" /> Done
          </button>
          <div className={`h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
          <button onClick={() => { onEdit(task); handleCloseMenu(); }} 
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
              darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
            }`}>                    
            <HiPencil size={14} className="text-blue-500" /> Edit Task
          </button>
          <button onClick={() => { onArchive(task.id); handleCloseMenu(); }} 
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
              darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
            }`}>                    
            <HiArchive size={14} className="text-purple-500" /> Archive
          </button>
          <button onClick={() => { onSoftDelete(task.id); handleCloseMenu(); }} 
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
              darkMode ? 'hover:bg-red-900/20 text-red-400' : 'hover:bg-red-50 text-red-600'
            }`}>
            <HiTrash size={14} className="text-red-500" /> Move to Trash
          </button>
        </>
      );
    }
    
    if (filter === 'archived') {
      return (
        <>
          <button onClick={() => { onUnarchive(task.id); handleCloseMenu(); }} 
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
              darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
            }`}>
            <HiRefresh size={14} className="text-green-500" /> Restore to Active
          </button>
          <button onClick={() => { onSoftDelete(task.id); handleCloseMenu(); }} 
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
              darkMode ? 'hover:bg-red-900/20 text-red-400' : 'hover:bg-red-50 text-red-600'
            }`}>
            <HiTrash size={14} className="text-red-500" /> Move to Trash
          </button>
        </>
      );
    }
    
    if (filter === 'deleted') {
      return (
        <>
          <button onClick={() => { onRestore(task.id); handleCloseMenu(); }} 
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
              darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
            }`}>
            <HiRefresh size={14} className="text-green-500" /> Restore from Trash
          </button>
          <button onClick={() => { onPermanentDelete(task.id); handleCloseMenu(); }} 
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
              darkMode ? 'hover:bg-red-900/20 text-red-400' : 'hover:bg-red-50 text-red-600'
            }`}>
            <HiTrash size={14} className="text-red-500" /> Delete Forever
          </button>
        </>
      );
    }
    
    return null;
  };

  return (
    <div className={`group relative rounded-xl p-4 transition-all duration-300 hover:shadow-lg border ${
      darkMode ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-gray-300'
    } ${isOverdue && filter === 'active' ? 'border-l-4 border-l-red-500' : ''}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1.5 ${getPriorityColor(task.priority)}`}>
              {getPriorityIcon(task.priority)}
              {getPriorityText(task.priority)}
            </span>
            
            <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1.5 ${getStatusColor(task.status)}`}>
              {task.status === 'todo' && <HiCheckCircle size={10} />}
              {task.status === 'in_progress' && <HiTrendingUp size={10} />}
              {task.status === 'done' && <HiCheckIcon size={10} />}
              {getStatusText(task.status)}
            </span>
            
            {isOverdue && filter === 'active' && task.status !== 'done' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 flex items-center gap-1.5">
                <HiClock size={10} /> Overdue
              </span>
            )}
            
            {filter === 'deleted' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 flex items-center gap-1.5">
                <HiTrash size={10} /> In Trash
              </span>
            )}
            
            {filter === 'archived' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 flex items-center gap-1.5">
                <HiArchive size={10} /> Archived
              </span>
            )}
          </div>
          
          <h4 className={`font-semibold text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {task.title}
          </h4>
          
          {task.description && (
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1 line-clamp-2`}>
              {task.description}
            </p>
          )}
          
          <div className="flex items-center gap-4 mt-3 text-xs flex-wrap">
            {task.due_date && (
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <HiCalendarIcon size={12} className="text-orange-400" />
                </div>
                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                  {new Date(task.due_date).toLocaleDateString()}
                </span>
              </div>
            )}
            {task.assigned_to_name && (
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <HiUser size={12} className="text-purple-400" />
                </div>
                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                  {task.assigned_to_name}
                </span>
              </div>
            )}
            {task.created_at && (
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <HiClock size={12} className="text-blue-400" />
                </div>
                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                  Created {new Date(task.created_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={() => setShowMenu(!showMenu)}
            className={`p-2 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <HiPencil className={darkMode ? 'text-gray-400' : 'text-gray-500'} size={14} />
          </button>
          
          <DropdownMenu
            isOpen={showMenu}
            onClose={() => setShowMenu(false)}
            anchorRef={buttonRef}
            darkMode={darkMode}
          >
            {renderMenuContent()}
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

// ==================== مكون نافذة إنشاء/تعديل مهمة ====================
function TaskModal({ formData, setFormData, users, onSubmit, onClose, darkMode, isEditing }) {
  const themeInput = darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400';

  const priorityOptions = [
    { value: 'low', label: 'Low Priority', icon: HiCheckCircle },
    { value: 'medium', label: 'Medium Priority', icon: HiStar },
    { value: 'high', label: 'High Priority', icon: HiFlag }
  ];

  const userOptions = [
    { value: '', label: '-- Select User --', icon: HiUser },
    ...users.map(user => ({ value: user.id, label: user.username, icon: HiUser }))
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`rounded-2xl p-6 w-[450px] shadow-2xl animate-modal-pop ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              {isEditing ? <HiPencil className="text-white text-xl" /> : <HiPlus className="text-white text-xl" />}
            </div>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {isEditing ? 'Edit Task' : 'Create New Task'}
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
              <HiTag size={14} /> Task Title
            </label>
            <input
              type="text"
              placeholder="Enter task title..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${themeInput}`}
              required
              autoFocus
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1.5 flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <HiPaperClip size={14} /> Description
            </label>
            <textarea
              placeholder="Enter task description (optional)..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none ${themeInput}`}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1.5 flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <HiFlag size={14} /> Priority
              </label>
              <CustomSelect
                value={formData.priority}
                onChange={(value) => setFormData({ ...formData, priority: value })}
                options={priorityOptions}
                placeholder="Select priority"
                icon={HiFlag}
                darkMode={darkMode}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1.5 flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <HiCalendarIcon size={14} /> Due Date
              </label>
              <input
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${themeInput}`}
              />
            </div>
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1.5 flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <HiUser size={14} /> Assign To
            </label>
            <CustomSelect
              value={formData.assigned_to || ''}
              onChange={(value) => setFormData({ ...formData, assigned_to: value || null })}
              options={userOptions}
              placeholder="Select user"
              icon={HiUser}
              darkMode={darkMode}
            />
          </div>
          
          <div className="flex gap-3 pt-3">
            <button 
              type="submit" 
              className="flex-1 py-2.5 rounded-xl font-medium transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              {isEditing ? 'Update Task' : 'Create Task'}
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

// ==================== المكون الرئيسي TasksPanel ====================
function TasksPanel({ token, darkMode }) {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    assigned_to: null
  });
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const limit = 10;

  useEffect(() => {
    fetchTasks();
    fetchUsers();
    fetchStats();
  }, [filter, page, search, sortBy, sortOrder]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/tasks?filter=${filter}&page=${page}&limit=${limit}&search=${search}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      setTasks(data.tasks || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tasks/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setShowCreateModal(false);
        resetForm();
        await fetchTasks();
        await fetchStats();
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const updateTask = async (e) => {
    e.preventDefault();
    if (!editingTask) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setShowEditModal(false);
        resetForm();
        await fetchTasks();
        await fetchStats();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      due_date: task.due_date ? task.due_date.slice(0, 16) : '',
      assigned_to: task.assigned_to || null
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      due_date: '',
      assigned_to: null
    });
    setEditingTask(null);
  };

  const updateStatus = async (taskId, status) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        await fetchTasks();
        await fetchStats();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const archiveTask = async (taskId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/archive`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        await fetchTasks();
        await fetchStats();
      }
    } catch (error) {
      console.error('Error archiving task:', error);
    }
  };

  const unarchiveTask = async (taskId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/unarchive`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        await fetchTasks();
        await fetchStats();
      }
    } catch (error) {
      console.error('Error unarchiving task:', error);
    }
  };

  const softDeleteTask = async (taskId) => {
    if (window.confirm('Move this task to trash? You can restore it within 30 days.')) {
      try {
        const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/soft`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          await fetchTasks();
          await fetchStats();
        }
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const restoreTask = async (taskId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/restore`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        await fetchTasks();
        await fetchStats();
      }
    } catch (error) {
      console.error('Error restoring task:', error);
    }
  };

  const permanentDeleteTask = async (taskId) => {
    if (window.confirm('Permanently delete this task? This action cannot be undone.')) {
      try {
        const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/permanent`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          await fetchTasks();
          await fetchStats();
        }
      } catch (error) {
        console.error('Error permanently deleting task:', error);
      }
    }
  };

  const filters = [
    { value: 'active', label: 'Active Tasks', icon: HiClipboardList, color: 'blue' },
    { value: 'archived', label: 'Archived', icon: HiArchive, color: 'purple' },
    { value: 'deleted', label: 'Trash', icon: HiTrash, color: 'red' }
  ];

  const sortOptions = [
    { value: 'created_at_DESC', label: 'Newest first', icon: HiSortDescending },
    { value: 'created_at_ASC', label: 'Oldest first', icon: HiSortAscending },
    { value: 'due_date_ASC', label: 'Due date (earliest)', icon: HiCalendarIcon },
    { value: 'due_date_DESC', label: 'Due date (latest)', icon: HiCalendarIcon },
    { value: 'priority_DESC', label: 'Priority (high to low)', icon: HiFlag },
    { value: 'title_ASC', label: 'Title A-Z', icon: HiSortAscending }
  ];

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

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 z-10">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-white'}`}>
            Task Manager
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-300'}`}>
            Manage your tasks efficiently
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 pr-6 px-4 py-2.5 rounded-xl font-medium transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-blue-400 to-purple-500 text-white"
        >
          <HiPlus size={16} />
          New Task
        </button>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard icon={HiClipboardList} title="Active Tasks" value={stats.active_tasks || 0} color="white" darkMode={darkMode} />
          <StatCard icon={HiCheckCircle} title="Completed" value={stats.completed_tasks || 0} color="white" darkMode={darkMode} />
          <StatCard icon={HiClock} title="Overdue" value={stats.overdue_tasks || 0} color="white" darkMode={darkMode} />
          <StatCard icon={HiArchive} title="Archived" value={stats.archived_tasks || 0} color="white" darkMode={darkMode} />
          <StatCard icon={HiTrash} title="Trash" value={stats.deleted_tasks || 0} color="white" darkMode={darkMode} />
        </div>
      )}
      </div>
      {/* Filters & Search */}
      <div className={`rounded-2xl p-5 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {filters.map(f => {
            const Icon = f.icon;
            const isActive = filter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => { setFilter(f.value); setPage(1); }}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : `${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`
                }`}
              >
                <Icon size={16} />
                <span className="text-sm">{f.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search and Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <HiSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'} text-sm`} />
            <input
              type="text"
              placeholder="Search tasks by title or description..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>
          
          <div className="min-w-[220px]">
            <CustomSelect
              value={`${sortBy}_${sortOrder}`}
              onChange={(value) => {
                const [newSortBy, newSortOrder] = value.split('_');
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
                setPage(1);
              }}
              options={sortOptions}
              placeholder="Sort by"
              icon={HiSortAscending}
              darkMode={darkMode}
            />
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className={`px-5 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${
              filter === 'active' ? 'bg-blue-500/10 dark:bg-blue-500/20' :
              filter === 'archived' ? 'bg-purple-500/10 dark:bg-purple-500/20' :
              'bg-red-500/10 dark:bg-red-500/20'
            } flex items-center justify-center`}>
              {filter === 'active' && <HiClipboardList className="text-blue-500 text-lg" />}
              {filter === 'archived' && <HiArchive className="text-purple-500 text-lg" />}
              {filter === 'deleted' && <HiTrash className="text-red-500 text-lg" />}
            </div>
            <div>
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {filter === 'active' ? 'Active Tasks' : filter === 'archived' ? 'Archived Tasks' : 'Trash'}
              </h3>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} found
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto overflow-x-visible">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                darkMode ? 'bg-gray-700' : 'bg-blue-50'
              }`}>
                <HiClipboardList className={`text-2xl ${darkMode ? 'text-gray-400' : 'text-blue-400'}`} />
              </div>
              <p className="text-sm">No tasks found</p>
              <p className="text-xs mt-1">Create a new task to get started</p>
            </div>
          ) : (
            tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                filter={filter}
                onStatusChange={updateStatus}
                onArchive={archiveTask}
                onUnarchive={unarchiveTask}
                onSoftDelete={softDeleteTask}
                onRestore={restoreTask}
                onPermanentDelete={permanentDeleteTask}
                onEdit={handleEdit}
                darkMode={darkMode}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`flex justify-between items-center px-5 py-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
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
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={`p-2 rounded-lg transition-all flex items-center gap-1 ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              } ${page === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="text-sm">Next</span>
              <HiChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <TaskModal
          formData={formData}
          setFormData={setFormData}
          users={users}
          onSubmit={createTask}
          onClose={() => { setShowCreateModal(false); resetForm(); }}
          darkMode={darkMode}
          isEditing={false}
        />
      )}

      {/* Edit Task Modal */}
      {showEditModal && (
        <TaskModal
          formData={formData}
          setFormData={setFormData}
          users={users}
          onSubmit={updateTask}
          onClose={() => { setShowEditModal(false); resetForm(); }}
          darkMode={darkMode}
          isEditing={true}
        />
      )}
    </div>
  );
}

export default TasksPanel;