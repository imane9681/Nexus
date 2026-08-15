import React, { useState, useEffect } from 'react';
import { 
  HiX, HiSun, HiMoon, HiBell, HiMail, HiGlobe, HiUser, HiSave,
  HiTag, HiUserCircle, HiCheckCircle, HiOutlineBell, HiOutlineMail,
  HiLanguage, HiPencil, HiSparkles
} from 'react-icons/hi';

function SettingsModal({ token, darkMode, onClose, onThemeChange }) {
  const [settings, setSettings] = useState({
    theme: darkMode ? 'dark' : 'light',
    notifications_enabled: true,
    email_notifications: true,
    language: 'en',
    bio: '',
    username: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/user/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setSettings(prev => ({ ...prev, ...data, theme: darkMode ? 'dark' : 'light' }));
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('http://localhost:5000/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          theme: settings.theme,
          notifications_enabled: settings.notifications_enabled,
          email_notifications: settings.email_notifications,
          language: settings.language,
          bio: settings.bio
        })
      });
      if (response.ok) {
        if (settings.theme !== (darkMode ? 'dark' : 'light')) {
          onThemeChange();
        }
        onClose();
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className={`rounded-2xl p-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className={`rounded-2xl w-[500px] max-w-full shadow-2xl animate-modal-pop ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex justify-between items-center p-5 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${
              darkMode ? 'bg-purple-500/20' : 'bg-purple-100'
            } flex items-center justify-center`}>
              <HiSparkles className={`text-lg ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Settings
              </h3>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Customize your experience
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
        
        {/* Content */}
        <div className="p-5 space-y-5 max-h-[450px] overflow-y-auto">
          {/* Theme Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-1 h-5 rounded-full ${darkMode ? 'bg-blue-500' : 'bg-blue-500'}`}></div>
              <label className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Appearance
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSettings({ ...settings, theme: 'light' })}
                className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  settings.theme === 'light'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : `${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                }`}
              >
                <HiSun size={16} />
                Light
              </button>
              <button
                onClick={() => setSettings({ ...settings, theme: 'dark' })}
                className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  settings.theme === 'dark'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : `${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                }`}
              >
                <HiMoon size={16} />
                Dark
              </button>
            </div>
          </div>
          
          {/* Bio Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-1 h-5 rounded-full ${darkMode ? 'bg-green-500' : 'bg-green-500'}`}></div>
              <label className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Bio
              </label>
            </div>
            <textarea
              value={settings.bio || ''}
              onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm resize-none ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
              }`}
              rows="3"
              placeholder="Tell something about yourself..."
            />
          </div>
          
          {/* Notifications Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-1 h-5 rounded-full ${darkMode ? 'bg-yellow-500' : 'bg-yellow-500'}`}></div>
              <label className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Notifications
              </label>
            </div>
            <div className="space-y-2">
              <label className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <HiBell size={14} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                  </div>
                  <div>
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Push Notifications
                    </span>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Receive browser notifications
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.notifications_enabled}
                    onChange={(e) => setSettings({ ...settings, notifications_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className={`w-9 h-5 rounded-full transition-all duration-200 ${
                    settings.notifications_enabled 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                      : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                  }`}>
                    <div className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                      settings.notifications_enabled ? 'translate-x-4' : 'translate-x-0'
                    }`}></div>
                  </div>
                </div>
              </label>
              
              <label className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <HiMail size={14} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                  </div>
                  <div>
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email Notifications
                    </span>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Receive email updates
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.email_notifications}
                    onChange={(e) => setSettings({ ...settings, email_notifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className={`w-9 h-5 rounded-full transition-all duration-200 ${
                    settings.email_notifications 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                      : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                  }`}>
                    <div className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                      settings.email_notifications ? 'translate-x-4' : 'translate-x-0'
                    }`}></div>
                  </div>
                </div>
              </label>
            </div>
          </div>
          
          {/* Language Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-1 h-5 rounded-full ${darkMode ? 'bg-cyan-500' : 'bg-cyan-500'}`}></div>
              <label className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Language
              </label>
            </div>
            <div className="relative">
              <HiGlobe size={16} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm appearance-none ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Footer Buttons */}
        <div className={`flex gap-3 p-5 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl font-medium transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-blue-600 to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <HiSave size={16} />
                Save Changes
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className={`flex-1 py-2.5 rounded-xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${
              darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;