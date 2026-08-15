import React, { useState, useEffect } from 'react';
import { 
  HiDocumentText, HiDownload, HiTrash, HiCalendar, 
  HiChartBar, HiChat, HiX, HiRefresh, HiPlus,
  HiFilter, HiClock, HiUser, HiHashtag, HiCheckCircle,
  HiDocument, HiTrendingUp, HiChip, HiDatabase
} from 'react-icons/hi';

// ==================== Component لبطاقة الإحصائيات ====================
const StatCard = ({ icon: Icon, title, value, color, darkMode }) => {
  const getGradient = () => {
    const gradients = {
      blue: 'bg-gradient-to-br from-blue-500 to-blue-700',
      purple: 'bg-gradient-to-br from-purple-500 to-purple-700',
      green: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
      orange: 'bg-gradient-to-br from-orange-500 to-orange-700',
      cyan: 'bg-gradient-to-br from-cyan-500 to-cyan-700'
    };
    return gradients[color] || gradients.blue;
  };

  return (
    <div className={`relative rounded-2xl p-4 transition-all duration-300 hover:shadow-lg overflow-hidden ${getGradient()}`}>
      <div className="absolute -bottom-20 -right-20 w-[200px] h-[200px] rounded-full bg-white/10"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/20">
              <Icon className="text-white text-sm" />
            </div>
            <p className="text-sm font-medium text-white/80">{title}</p>
          </div>
        </div>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
      </div>
    </div>
  );
};

// ==================== مكون عنصر التقرير ====================
const ReportItem = ({ report, onDownload, onDelete, darkMode }) => {
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getReportIcon = (filename) => {
    if (filename.includes('tasks')) return <HiDocumentText className="text-blue-500" size={20} />;
    if (filename.includes('chat')) return <HiChat className="text-purple-500" size={20} />;
    if (filename.includes('statistics')) return <HiChartBar className="text-green-500" size={20} />;
    return <HiDocument className="text-gray-500" size={20} />;
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
          {getReportIcon(report.filename)}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>
            {report.filename}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {formatFileSize(report.size)}
            </span>
            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>•</span>
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {new Date(report.created_at).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
        <button
          onClick={() => onDownload(report.filename)}
          className={`p-2 rounded-lg transition-all hover:scale-110 ${
            darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
          }`}
          title="Download"
        >
          <HiDownload size={16} className="text-emerald-500" />
        </button>
        <button
          onClick={() => onDelete(report.filename)}
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

// ==================== المكون الرئيسي ReportsPanel ====================
function ReportsPanel({ token, darkMode }) {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState('tasks');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10)
  });
  const [includeCompleted, setIncludeCompleted] = useState(true);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchReports();
    fetchRooms();
    fetchStats();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/rooms', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/reports/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      let endpoint = '';
      let body = {};
      
      if (reportType === 'tasks') {
        endpoint = 'http://localhost:5000/api/reports/tasks';
        body = {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          includeCompleted,
          includeArchived
        };
      } else if (reportType === 'chat') {
        endpoint = 'http://localhost:5000/api/reports/chat';
        body = {
          roomId: selectedRoom,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        };
      } else if (reportType === 'statistics') {
        endpoint = 'http://localhost:5000/api/reports/statistics';
        body = {};
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      
      if (response.ok) {
        fetchReports();
        fetchStats();
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = (filename) => {
    window.open(`http://localhost:5000/api/reports/download/${filename}?token=${token}`, '_blank');
  };

  const deleteReport = async (filename) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        await fetch(`http://localhost:5000/api/reports/${filename}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchReports();
        fetchStats();
      } catch (error) {
        console.error('Error deleting report:', error);
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalSize = reports.reduce((sum, r) => sum + (r.size || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Reports
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Generate and manage analytical reports
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-blue-600 to-purple-600 text-white"
        >
          <HiPlus size={18} />
          New Report
        </button>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard icon={HiDocumentText} title="Total Reports" value={stats.totalReports || 0} color="blue" darkMode={darkMode} />
          <StatCard icon={HiDatabase} title="Total Size" value={formatFileSize(stats.totalSize || 0)} color="purple" darkMode={darkMode} />
          <StatCard icon={HiTrendingUp} title="This Month" value={stats.thisMonth || 0} color="green" darkMode={darkMode} />
          <StatCard icon={HiChip} title="Report Types" value={stats.reportTypes || 0} color="orange" darkMode={darkMode} />
        </div>
      )}

      {/* Generate Report Form Modal */}
      {/* Generate Report Form Modal */}
{showFilters && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
    <div className={`rounded-2xl p-6 w-[500px] shadow-2xl animate-modal-pop ${
      darkMode ? 'bg-gray-800' : 'bg-white'
    }`}>
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <HiDocumentText className="text-white text-xl" />
          </div>
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Generate New Report
          </h3>
        </div>
        <button 
          onClick={() => setShowFilters(false)} 
          className={`p-2 rounded-lg transition-all hover:scale-110 ${
            darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
        >
          <HiX size={18} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
        </button>
      </div>
      
      {/* Report Type Selector */}
      <div className="mb-5">
        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Report Type
        </label>
        <div className="grid grid-cols-3 gap-2">
          {/* Tasks Report Button */}
          <button
            onClick={() => setReportType('tasks')}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1 ${
              reportType === 'tasks'
                ? 'bg-blue-600 text-white shadow-md'
                : darkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <HiDocumentText size={18} />
            <span>Tasks Report</span>
          </button>
          
          {/* Chat Export Button */}
          <button
            onClick={() => setReportType('chat')}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1 ${
              reportType === 'chat'
                ? 'bg-purple-600 text-white shadow-md'
                : darkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <HiChat size={18} />
            <span>Chat Export</span>
          </button>
          
          {/* Statistics Button */}
          <button
            onClick={() => setReportType('statistics')}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1 ${
              reportType === 'statistics'
                ? 'bg-green-600 text-white shadow-md'
                : darkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <HiChartBar size={18} />
            <span>Statistics</span>
          </button>
        </div>
      </div>
      
      {/* Date Range */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className={`block text-xs font-medium mb-1.5 flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <HiCalendar size={12} /> Start Date
          </label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
            }`}
          />
        </div>
        <div>
          <label className={`block text-xs font-medium mb-1.5 flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <HiCalendar size={12} /> End Date
          </label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
            }`}
          />
        </div>
      </div>
      
      {/* Chat Room Selector */}
      {reportType === 'chat' && (
        <div className="mb-4">
          <label className={`block text-xs font-medium mb-1.5 flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <HiHashtag size={12} /> Select Room
          </label>
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(parseInt(e.target.value))}
            className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
            }`}
          >
            {rooms.map(room => (
              <option key={room.id} value={room.id}>#{room.name}</option>
            ))}
          </select>
        </div>
      )}
      
      {/* Task Options */}
      {reportType === 'tasks' && (
        <div className="mb-4 space-y-2">
          <label className={`flex items-center gap-2 cursor-pointer ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <input
              type="checkbox"
              checked={includeCompleted}
              onChange={(e) => setIncludeCompleted(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm">Include completed tasks</span>
          </label>
          <label className={`flex items-center gap-2 cursor-pointer ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm">Include archived tasks</span>
          </label>
        </div>
      )}
      
      {/* Generate Button */}
      <div className="flex gap-3 pt-3">
        <button
          onClick={generateReport}
          disabled={generating}
          className="flex-1 py-2.5 rounded-xl font-medium transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-blue-600 to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </span>
          ) : (
            'Generate Report'
          )}
        </button>
        <button
          onClick={() => setShowFilters(false)}
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

      {/* Reports List Container */}
      <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        
        {/* Reports Header */}
        <div className={`px-5 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${
                darkMode ? 'bg-blue-500/20' : 'bg-blue-100'
              } flex items-center justify-center`}>
                <HiDocumentText className={`text-lg ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Generated Reports
                </h3>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {reports.length} reports • Total {formatFileSize(totalSize)}
                </p>
              </div>
            </div>
            <button
              onClick={fetchReports}
              className={`p-2 rounded-lg transition-all ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              title="Refresh"
            >
              <HiRefresh size={16} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
            </button>
          </div>
        </div>

        {/* Reports List */}
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className={`text-center py-16 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                darkMode ? 'bg-gray-700' : 'bg-blue-50'
              }`}>
                <HiDocumentText className={`text-3xl ${darkMode ? 'text-gray-500' : 'text-blue-400'}`} />
              </div>
              <p className="text-sm">No reports generated yet</p>
              <p className="text-xs mt-1">Click "New Report" to get started</p>
            </div>
          ) : (
            <div className="space-y-1">
              {reports.map(report => (
                <ReportItem
                  key={report.filename}
                  report={report}
                  onDownload={downloadReport}
                  onDelete={deleteReport}
                  darkMode={darkMode}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportsPanel;