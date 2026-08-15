import React, { useState, useEffect, useCallback } from 'react';
import { 
  HiUpload, HiFolder, HiDocument, HiPhotograph, HiTrash, 
  HiDownload, HiDatabase, HiX, HiCloudUpload, HiDocumentText,
  HiRefresh, HiFolderOpen, HiPlus, HiSearch, HiFilter,
  HiChip, HiChartBar, HiClock, HiHome, HiFolderAdd,
  HiArrowNarrowRight, HiViewGrid, HiViewList, HiDotsVertical
} from 'react-icons/hi';

// ==================== StatCard Component ====================
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

// ==================== FileItem Component ====================
const FileItem = ({ file, onDownload, onDelete, onMove, darkMode }) => {
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return <HiPhotograph className="text-purple-500" size={20} />;
    if (mimeType === 'application/pdf') return <HiDocumentText className="text-red-500" size={20} />;
    if (mimeType?.startsWith('video/')) return <HiPhotograph className="text-pink-500" size={20} />;
    if (mimeType?.startsWith('audio/')) return <HiDocument className="text-green-500" size={20} />;
    if (mimeType === 'application/zip' || mimeType?.includes('compressed')) return <HiDatabase className="text-yellow-500" size={20} />;
    return <HiDocument className="text-blue-500" size={20} />;
  };

  const getIconBg = () => {
    return darkMode ? 'bg-gray-700' : 'bg-gray-100';
  };

  return (
    <div className={`group flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
      darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
    }`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getIconBg()}`}>
          {getFileIcon(file.mime_type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>
            {file.original_name}
          </p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {formatFileSize(file.file_size)}
            </span>
            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>•</span>
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {formatDate(file.created_at)}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
              {file.folder === '/' ? 'Root' : file.folder.replace(/^\//, '')}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
        <button
          onClick={() => onDownload(file.id, file.original_name)}
          className={`p-2 rounded-lg transition-all hover:scale-110 ${
            darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
          }`}
          title="Download"
        >
          <HiDownload size={16} className="text-emerald-500" />
        </button>
        <button
          onClick={() => onMove(file)}
          className={`p-2 rounded-lg transition-all hover:scale-110 ${
            darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
          }`}
          title="Move to folder"
        >
          <HiFolderAdd size={16} className="text-blue-500" />
        </button>
        <button
          onClick={() => onDelete(file.id, false, file.original_name)}
          className={`p-2 rounded-lg transition-all hover:scale-110 ${
            darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
          }`}
          title="Delete"
        >
          <HiTrash size={16} className="text-red-500" />
        </button>
      </div>
    </div>
  );
};

// ==================== FolderItem Component with Delete Button ====================
const FolderItem = ({ folder, fileCount, isActive, onClick, onDelete, darkMode }) => {
  const [showMenu, setShowMenu] = useState(false);
  const folderName = folder.folder === '/' ? 'Root' : folder.folder.replace(/^\/+/, '');
  
  const isDeletable = folder.folder !== '/';
  
  return (
    <div className="relative group">
      <button
        onClick={() => onClick(folder.folder)}
        className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 w-full text-left ${
          isActive 
            ? darkMode ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'
            : darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
        }`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          darkMode ? 'bg-blue-500/20' : 'bg-blue-100'
        }`}>
          <HiFolderOpen className={`text-xl ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
        </div>
        <div className="flex-1 text-left">
          <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {folderName}
          </p>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            📄 {fileCount} file{fileCount !== 1 ? 's' : ''}
          </p>
        </div>
      </button>
      
      {isDeletable && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className={`p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${
              darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
            }`}
            title="Folder options"
          >
            <HiDotsVertical size={14} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
          </button>
          
          {showMenu && (
            <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-10 ${
              darkMode ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-200'
            }`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onDelete(folder.folder, true, folderName);
                }}
                className={`flex items-center gap-2 w-full px-4 py-2 text-sm rounded-lg transition-all ${
                  darkMode ? 'text-red-400 hover:bg-gray-600' : 'text-red-600 hover:bg-gray-50'
                }`}
              >
                <HiTrash size={14} />
                Delete Folder
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==================== CreateFolderModal Component ====================
const CreateFolderModal = ({ isOpen, onClose, onCreate, darkMode }) => {
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!folderName.trim()) {
      setError('Folder name is required');
      return;
    }
    if (folderName.includes('/') || folderName.includes('\\')) {
      setError('Folder name cannot contain slashes');
      return;
    }
    onCreate(folderName);
    setFolderName('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`rounded-2xl p-6 w-[400px] shadow-2xl animate-modal-pop ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <HiFolderAdd className="text-white text-xl" />
            </div>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Create New Folder
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
        
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Folder Name
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="e.g., Documents, Images, Projects"
              className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
              }`}
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl font-medium transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              Create Folder
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
};

// ==================== DeleteConfirmModal Component ====================
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, itemName, isFolder, fileCount, darkMode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`rounded-2xl p-6 w-[450px] shadow-2xl animate-modal-pop ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <HiTrash className="text-red-500 text-2xl" />
          </div>
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Delete {isFolder ? 'Folder' : 'File'}
          </h3>
        </div>
        
        <div className="mb-6">
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Are you sure you want to delete {isFolder ? 'folder' : 'file'} <span className="font-semibold">"{itemName}"</span>?
          </p>
          
          {isFolder && fileCount > 0 && (
            <div className={`mt-3 p-3 rounded-lg ${darkMode ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-yellow-50 border border-yellow-200'}`}>
              <p className={`text-sm ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                ⚠️ Warning: This folder contains <strong>{fileCount}</strong> file{fileCount !== 1 ? 's' : ''}. 
                All files inside will be permanently deleted!
              </p>
            </div>
          )}
          
          <p className={`text-sm mt-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            This action cannot be undone.
          </p>
        </div>
        
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

// ==================== MoveFileModal Component ====================
const MoveFileModal = ({ isOpen, onClose, onConfirm, fileName, folders, currentFolder, darkMode }) => {
  const [targetFolder, setTargetFolder] = useState('/');

  if (!isOpen) return null;

  const availableFolders = folders.filter(f => f.folder !== currentFolder);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`rounded-2xl p-6 w-[450px] shadow-2xl animate-modal-pop ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
            <HiFolderAdd className="text-blue-500 text-2xl" />
          </div>
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Move File
          </h3>
        </div>
        <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Move "{fileName}" to:
        </p>
        
        <div className="mb-5 max-h-64 overflow-y-auto">
          <div className="space-y-2">
            <button
              onClick={() => setTargetFolder('/')}
              className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${
                targetFolder === '/'
                  ? darkMode ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'
                  : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              }`}
            >
              <HiHome className={`text-xl ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Root</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Main Directory</p>
              </div>
            </button>
            
            {availableFolders.map(folder => (
              <button
                key={folder.folder}
                onClick={() => setTargetFolder(folder.folder)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${
                  targetFolder === folder.folder
                    ? darkMode ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'
                    : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }`}
              >
                <HiFolder className={`text-xl ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {folder.folder.replace(/^\//, '')}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {folder.fileCount} file{folder.fileCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => onConfirm(targetFolder)}
            className="flex-1 py-2.5 rounded-xl font-medium transition-all bg-blue-600 text-white hover:bg-blue-700"
          >
            Move Here
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

// ==================== Toast Notification Component ====================
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  
  return (
    <div className={`fixed bottom-4 right-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-slide-up`}>
      {message}
    </div>
  );
};

// ==================== Main FileManager Component ====================
function FileManager({ token, darkMode, roomId = null }) {
  const [files, setFiles] = useState([]);
  const [allFolders, setAllFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState('/');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteIsFolder, setDeleteIsFolder] = useState(false);
  const [deleteItemName, setDeleteItemName] = useState('');
  const [deleteFileCount, setDeleteFileCount] = useState(0);
  const [movingFile, setMovingFile] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadFolder, setUploadFolder] = useState('/');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('folders');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchAllFolders = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/folders/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAllFolders(data);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  }, [token]);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/files?folder=${encodeURIComponent(currentFolder)}&limit=100&offset=0&search=${search}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      setFiles((data.files || []).filter(file => !file.original_name.endsWith('.folder')));
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  }, [currentFolder, search, token]);

  const fetchAllFiles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/files/all?limit=100&offset=0&search=${search}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      setFiles((data.files || []).filter(file => !file.original_name.endsWith('.folder')));
    } catch (error) {
      console.error('Error fetching all files:', error);
    } finally {
      setLoading(false);
    }
  }, [search, token]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/files/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [token]);

  useEffect(() => {
    if (viewMode === 'folders') {
      fetchFiles();
    } else {
      fetchAllFiles();
    }
    fetchAllFolders();
    fetchStats();
  }, [currentFolder, search, viewMode, fetchFiles, fetchAllFiles, fetchAllFolders, fetchStats]);

  const uploadFile = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('folder', uploadFolder);
    if (roomId) formData.append('room_id', roomId);
    
    try {
      const response = await fetch('http://localhost:5000/api/files/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (response.ok) {
        setShowUploadModal(false);
        setSelectedFile(null);
        setUploadFolder('/');
        await fetchFiles();
        await fetchAllFolders();
        await fetchStats();
        showToast(`File "${selectedFile.name}" uploaded successfully!`, 'success');
      } else {
        const error = await response.json();
        showToast(error.error || 'Upload failed', 'error');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      showToast('Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const createFolder = async (folderName) => {
    try {
      const formData = new FormData();
      const blob = new Blob([''], { type: 'text/plain' });
      formData.append('file', blob, '.folder');
      const newFolderPath = currentFolder === '/' ? `/${folderName}` : `${currentFolder}/${folderName}`;
      formData.append('folder', newFolderPath);
      
      const response = await fetch('http://localhost:5000/api/files/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (response.ok) {
        await fetchFiles();
        await fetchAllFolders();
        await fetchStats();
        showToast(`Folder "${folderName}" created successfully!`, 'success');
      } else {
        showToast('Failed to create folder', 'error');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      showToast('Failed to create folder', 'error');
    }
  };

  const downloadFile = (fileId, filename) => {
    window.open(`http://localhost:5000/api/files/${fileId}/download?token=${token}`, '_blank');
    showToast(`Downloading "${filename}"...`, 'success');
  };

  const handleDelete = async (target, isFolder, name) => {
    if (isFolder) {
      const folderFiles = files.filter(f => f.folder === target);
      setDeleteFileCount(folderFiles.length);
    }
    setDeleteTarget(target);
    setDeleteIsFolder(isFolder);
    setDeleteItemName(name);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      let response;
      if (deleteIsFolder) {
        response = await fetch(`http://localhost:5000/api/folders/${encodeURIComponent(deleteTarget)}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        response = await fetch(`http://localhost:5000/api/files/${deleteTarget}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      
      if (response.ok) {
        const result = await response.json();
        await fetchFiles();
        await fetchAllFolders();
        await fetchStats();
        
        if (deleteIsFolder && currentFolder === deleteTarget) {
          setCurrentFolder('/');
        }
        
        showToast(
          deleteIsFolder 
            ? `Folder "${deleteItemName}" deleted successfully! ${result.filesDeleted ? `(${result.filesDeleted} files removed)` : ''}`
            : `File "${deleteItemName}" deleted successfully!`,
          'success'
        );
      } else {
        const error = await response.json();
        showToast(error.error || `Failed to delete ${deleteIsFolder ? 'folder' : 'file'}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      showToast(`Error deleting ${deleteIsFolder ? 'folder' : 'file'}`, 'error');
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
      setDeleteIsFolder(false);
      setDeleteItemName('');
      setDeleteFileCount(0);
    }
  };

  const handleMove = (file) => {
    setMovingFile(file);
    setShowMoveModal(true);
  };

  const confirmMove = async (targetFolder) => {
    if (!movingFile) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/files/${movingFile.id}/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetFolder })
      });
      
      if (response.ok) {
        await fetchFiles();
        await fetchAllFolders();
        await fetchStats();
        setShowMoveModal(false);
        setMovingFile(null);
        showToast(`File "${movingFile.original_name}" moved successfully!`, 'success');
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to move file', 'error');
      }
    } catch (error) {
      console.error('Error moving file:', error);
      showToast('Error moving file', 'error');
    }
  };

  const navigateToFolder = (folderPath) => {
    setCurrentFolder(folderPath);
    setViewMode('folders');
    setSearch('');
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const usagePercent = stats ? ((stats.totalSize / stats.maxStorage) * 100) : 0;

  const filteredFiles = files.filter(file => 
    !file.original_name.endsWith('.folder') &&
    (!search || file.original_name.toLowerCase().includes(search.toLowerCase()))
  );

  const displayFolders = [
    { folder: '/', fileCount: filteredFiles.filter(f => f.folder === '/' && !f.original_name.endsWith('.folder')).length },
    ...allFolders.filter(f => f.folder !== '/')
  ];

  const getCurrentFolderFileCount = () => {
    return filteredFiles.filter(f => f.folder === currentFolder).length;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="relative p-7 pb-9  bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl overflow-hidden ">
        {/* الصورة في الخلفية */}
       <img 
         src="/Group 1261152731.png" 
         alt=""
         className="absolute inset-0 w-full h-full opacity-50"
        />
      <div className=" relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-white'}`}>
            File Manager
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-200' : 'text-gray-200'}`}>
            Manage and organize your files
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateFolderModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-orange-300 to-purple-500 text-white"
          >
            <HiFolderAdd size={18} />
            New Folder
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-blue-400 to-purple-500 text-white"
          >
            <HiUpload size={18} />
            Upload File
          </button>
        </div>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={HiDatabase} title="Total Files" value={stats.totalFiles || 0} color="white" darkMode={darkMode} />
          <StatCard icon={HiChip} title="Total Size" value={formatFileSize(stats.totalSize)} color="white" darkMode={darkMode} />
          <StatCard icon={HiChartBar} title="Storage Used" value={`${Math.round(usagePercent)}%`} color="white" darkMode={darkMode} />
        </div>
      )}
      </div>
      {/* Storage Progress */}
      {stats && (
        <div className={`rounded-2xl p-5 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Storage Usage</h3>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {formatFileSize(stats.totalSize)} of {formatFileSize(stats.maxStorage)}
              </p>
            </div>
            {usagePercent > 80 && (
              <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                ⚠️ Almost full
              </span>
            )}
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: darkMode ? '#374151' : '#E5E7EB' }}>
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                usagePercent > 90 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
              }`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* File Browser Container */}
      <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        
        {/* Navigation Bar - Professional Design */}
        <div className={`px-5 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
              {viewMode === 'folders' ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => navigateToFolder('/')}
                    className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      currentFolder === '/' 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-blue-500/25' 
                        : `${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700/80' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`
                    }`}
                  >
                    <HiHome size={14} className={currentFolder === '/' ? 'text-white' : ''} />
                    <span>Root</span>
                  </button>
                  
                  {currentFolder !== '/' && (
                    <>
                      <span className={`text-sm ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>/</span>
                      <div className="flex items-center gap-1.5">
                        <HiFolderOpen size={14} className={darkMode ? 'text-blue-400' : 'text-blue-500'} />
                        <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {currentFolder.replace(/^\//, '')}
                        </span>
                        <span className={`text-xs ml-1 px-2 py-0.5 rounded-full ${
                          darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {getCurrentFolderFileCount()} files
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                    darkMode ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20' : 'bg-gradient-to-r from-blue-50 to-purple-50'
                  }`}>
                    <HiViewList size={16} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      All Files
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      darkMode ? 'bg-gray-700 text-gray-400' : 'bg-white text-gray-500'
                    }`}>
                      {filteredFiles.length} total
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Right side: View Toggle + Search + Refresh */}
            <div className="flex items-center gap-3">
              {/* View Mode Toggle - Professional Design */}
              <div className={`flex rounded-xl p-0.5 ${
                darkMode ? 'bg-gray-700/50' : 'bg-gray-100'
              }`}>
                <button
                  onClick={() => setViewMode('folders')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === 'folders'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-blue-500/25'
                      : darkMode 
                        ? 'text-gray-400 hover:text-white hover:bg-gray-600/50' 
                        : 'text-gray-500 hover:text-gray-900 hover:bg-white'
                  }`}
                >
                  <HiViewGrid size={16} />
                  <span className="hidden sm:inline">Folders</span>
                </button>
                <button
                  onClick={() => setViewMode('all')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === 'all'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-blue-500/25'
                      : darkMode 
                        ? 'text-gray-400 hover:text-white hover:bg-gray-600/50' 
                        : 'text-gray-500 hover:text-gray-900 hover:bg-white'
                  }`}
                >
                  <HiViewList size={16} />
                  <span className="hidden sm:inline">All Files</span>
                </button>
              </div>

              {/* Search Box */}
              <div className="relative">
                <HiSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'} text-sm`} />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`w-56 pl-9 pr-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => viewMode === 'folders' ? fetchFiles() : fetchAllFiles()}
                className={`p-2 rounded-lg transition-all hover:scale-110 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                title="Refresh"
              >
                <HiRefresh size={18} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Folders Section */}
            {viewMode === 'folders' && displayFolders.length > 0 && (
              <div className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <HiFolderOpen className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Folders</h3>
                      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        ({displayFolders.length} folders)
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {displayFolders.map(folder => (
                      <FolderItem
                        key={folder.folder}
                        folder={folder}
                        fileCount={folder.fileCount}
                        isActive={currentFolder === folder.folder}
                        onClick={navigateToFolder}
                        onDelete={handleDelete}
                        darkMode={darkMode}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Files Section */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <HiDocument className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {viewMode === 'folders' ? 'Files' : 'All Files'}
                </h3>
                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  ({filteredFiles.length} files)
                </span>
              </div>
              
              {filteredFiles.length === 0 ? (
                <div className={`text-center py-16 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    darkMode ? 'bg-gray-700' : 'bg-blue-50'
                  }`}>
                    <HiCloudUpload className={`text-3xl ${darkMode ? 'text-gray-500' : 'text-blue-400'}`} />
                  </div>
                  <p className="text-sm">No files found</p>
                  <p className="text-xs mt-1">Upload your first file to get started</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredFiles.map(file => (
                    <FileItem
                      key={file.id}
                      file={file}
                      onDownload={downloadFile}
                      onDelete={handleDelete}
                      onMove={handleMove}
                      darkMode={darkMode}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <CreateFolderModal
        isOpen={showCreateFolderModal}
        onClose={() => setShowCreateFolderModal(false)}
        onCreate={createFolder}
        darkMode={darkMode}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
          setDeleteIsFolder(false);
          setDeleteItemName('');
          setDeleteFileCount(0);
        }}
        onConfirm={confirmDelete}
        itemName={deleteItemName}
        isFolder={deleteIsFolder}
        fileCount={deleteFileCount}
        darkMode={darkMode}
      />

      <MoveFileModal
        isOpen={showMoveModal}
        onClose={() => {
          setShowMoveModal(false);
          setMovingFile(null);
        }}
        onConfirm={confirmMove}
        fileName={movingFile?.original_name || ''}
        folders={displayFolders}
        currentFolder={movingFile?.folder}
        darkMode={darkMode}
      />

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`rounded-2xl p-6 w-[450px] shadow-2xl animate-modal-pop ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <HiUpload className="text-white text-xl" />
                </div>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Upload File
                </h3>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)} 
                className={`p-2 rounded-lg transition-all hover:scale-110 ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <HiX size={18} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
              </button>
            </div>
            
            <div 
              className={`mb-4 p-8 text-center border-2 border-dashed rounded-xl transition-all cursor-pointer ${
                darkMode ? 'border-gray-600 hover:border-blue-500' : 'border-gray-300 hover:border-blue-400'
              } ${selectedFile ? 'border-blue-500 bg-blue-500/5' : ''}`}
              onClick={() => document.getElementById('file-input').click()}
            >
              <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                darkMode ? 'bg-gray-700' : 'bg-blue-50'
              }`}>
                <HiCloudUpload className={`text-2xl ${selectedFile ? 'text-blue-500' : darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {selectedFile ? selectedFile.name : 'Click or drag file to upload'}
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Max 10MB • Images, PDF, Documents, ZIP
              </p>
              
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="hidden"
                id="file-input"
              />
            </div>

            <div className="mb-5">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Upload to Folder
              </label>
              <select
                value={uploadFolder}
                onChange={(e) => setUploadFolder(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
              >
                <option value="/">📁 Root (Main Directory)</option>
                {displayFolders.filter(f => f.folder !== '/').map(folder => (
                  <option key={folder.folder} value={folder.folder}>
                    📁 {folder.folder.replace(/^\//, '')} ({folder.fileCount} files)
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={uploadFile}
                disabled={!selectedFile || uploading}
                className="flex-1 py-2.5 rounded-xl font-medium transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-blue-600 to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Uploading...
                  </span>
                ) : (
                  'Upload'
                )}
              </button>
              <button
                onClick={() => setShowUploadModal(false)}
                className={`flex-1 py-2.5 rounded-xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileManager;