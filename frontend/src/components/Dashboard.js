import React, { useState, useEffect } from 'react';
import {
  HiUsers, HiChat, HiArchive, HiClock, HiUser, HiMail,
  HiDatabase, HiRefresh, HiChip, HiGlobeAlt, HiTrendingUp,
  HiCog, HiServer, HiCalendar, HiChartPie,
  HiDownload, HiShare, HiBell, HiCheckCircle, HiExclamationCircle,
  HiChartSquareBar, HiTable, HiChartBar, HiHashtag
} from 'react-icons/hi';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

// ==================== Component لبطاقة الإحصائيات ====================
const StatCard = ({ icon: Icon, title, value, subtext, color, darkMode }) => {
  const getGradient = () => {
    const gradients = {
      blue: 'bg-gradient-to-br from-blue-600/60 to-blue-800/60',
      purple: 'bg-gradient-to-br from-purple-600/60 to-purple-800/60',
      emerald: 'bg-gradient-to-br from-emerald-600/60 to-emerald-800/60',
      orange: 'bg-gradient-to-br from-orange-600/60 to-orange-800/60',
    };
    return gradients[color] || gradients.blue;
  };

  const formatValue = (val) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val;
  };

  return (
    <div className={`relative rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] overflow-hidden ${getGradient()}`}>
      <div className="absolute -bottom-20 -right-20 w-[200px] h-[200px] rounded-full bg-white/10"></div>
      <div className="absolute -bottom-12 -right-12 w-[120px] h-[120px] rounded-full bg-white/5"></div>
      <div className="absolute -bottom-6 -right-6 w-16 h-16 rounded-full bg-white/10"></div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
            <Icon className="text-white text-xl" />
          </div>
          <p className="text-lg font-medium text-white/90">{title}</p>
        </div>
        <div className="mb-2">
          <p className="text-3xl font-bold text-white tracking-tight">{formatValue(value)}</p>
        </div>
        {subtext && <p className="text-sm text-white/70">{subtext}</p>}
      </div>
    </div>
  );
};

// ==================== Component لـ Custom Tooltip ====================
const CustomTooltip = ({ active, payload, label, darkMode }) => {
  if (active && payload && payload.length) {
    return (
      <div className={`p-3 rounded-xl shadow-2xl border backdrop-blur-sm ${darkMode ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'}`}>
        <p className={`text-sm font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{label}</p>
        {payload.map((p, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{p.name}:</span>
            <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ==================== Component لجدول الرسائل ====================
const RecentMessagesTable = ({ messages, darkMode }) => {
  if (!messages || messages.length === 0) {
    return (
      <div className={`text-center py-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        <HiChat className="text-4xl mx-auto mb-3 opacity-30" />
        <p className="text-sm">No messages yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <th className={`text-left py-3 px-5 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <div className="flex items-center gap-2"><HiUser size={12} /> User</div>
            </th>
            <th className={`text-left py-3 px-5 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <div className="flex items-center gap-2"><HiChat size={12} /> Message</div>
            </th>
            <th className={`text-left py-3 px-5 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <div className="flex items-center gap-2"><HiHashtag size={12} /> Room</div>
            </th>
            <th className={`text-left py-3 px-5 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <div className="flex items-center gap-2"><HiClock size={12} /> Time</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {messages.map((msg, idx) => (
            <tr key={idx} className={`border-b transition-all duration-200 ${darkMode ? 'border-gray-700/50 hover:bg-gray-800/50' : 'border-gray-50 hover:bg-gray-50'}`}>
              <td className="py-3 px-5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
                    <span className="text-white text-xs font-medium">{msg.username?.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{msg.username}</span>
                </div>
               </td>
              <td className={`py-3 px-5 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-md truncate`}>
                {msg.content?.length > 60 ? msg.content.substring(0, 60) + '...' : msg.content}
               </td>
              <td className="py-3 px-5">
                <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                  #{msg.room_name || 'general'}
                </span>
               </td>
              <td className={`py-3 px-5 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ==================== Component للمخطط الدائري ====================
const CustomPieChart = ({ data, darkMode }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const onPieEnter = (_, index) => setActiveIndex(index);
  const onPieLeave = () => setActiveIndex(null);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[280px]">
        <HiChartPie className={`text-5xl mb-3 ${darkMode ? 'text-gray-700' : 'text-gray-300'}`} />
        <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No data available</p>
        <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'} mt-1`}>Send messages to see distribution</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Pie Chart Container */}
      <div className="relative" style={{ width: '240px', height: '240px', margin: '0 auto' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              cornerRadius={6}
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke={darkMode ? '#1F2937' : '#FFFFFF'}
                  strokeWidth={2}
                  style={{
                    filter: activeIndex === index ? 'brightness(0.95)' : 'none',
                    cursor: 'pointer',
                    transition: 'filter 0.2s ease'
                  }}
                />
              ))}
            </Pie>
            <Tooltip 
              content={<CustomTooltip darkMode={darkMode} />} 
              cursor={{ stroke: 'none' }}
              wrapperStyle={{ 
                zIndex: 1000,
                pointerEvents: 'none'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Total in Center */}
        <div 
          className="absolute flex items-center justify-center pointer-events-none"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '118px',
            height: '118px',
            borderRadius: '50%',
            backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(4px)',
            zIndex: 5,
            boxShadow: darkMode ? '0 0 0 2px #37415189' : '0 0 0 2px #e5e7eb80'
          }}
        >
          <div className="text-center">
            <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {total}
            </div>
            <div className={`text-[10px] uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
              Total
            </div>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-3 mb-4">
        {data.map((item, index) => {
          const percentage = ((item.value / total) * 100).toFixed(1);
          return (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {item.name} ({percentage}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==================== Component لمنطقة النشاط (Area Chart) ====================
const ActivityAreaChart = ({ data, darkMode }) => {
  if (!data || data.length === 0 || data.every(d => d.messages === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-[260px]">
        <HiChartBar className={`text-5xl mb-3 ${darkMode ? 'text-gray-700' : 'text-gray-300'}`} />
        <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No activity data available</p>
        <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'} mt-1`}>Send messages to see chart</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
        <XAxis dataKey="name" axisLine={false} tickLine={false} stroke={darkMode ? '#9CA3AF' : '#6B7280'} fontSize={12} />
        <YAxis axisLine={false} tickLine={false} stroke={darkMode ? '#9CA3AF' : '#6B7280'} fontSize={12} />
        <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
        <Area type="monotone" dataKey="messages" stroke="#3B82F6" fill="url(#colorMessages)" strokeWidth={2.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// ==================== Component لشريط النشاط (Bar Chart) ====================
const ActivityBarChart = ({ data, darkMode }) => {
  if (!data || data.length === 0 || data.every(d => d.messages === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-[260px]">
        <HiChartBar className={`text-5xl mb-3 ${darkMode ? 'text-gray-700' : 'text-gray-300'}`} />
        <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No activity data available</p>
        <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'} mt-1`}>Send messages to see chart</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 60, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
        <XAxis dataKey="name" axisLine={false} tickLine={false} stroke={darkMode ? '#9CA3AF' : '#6B7280'} fontSize={12} />
        <YAxis axisLine={false} tickLine={false} stroke={darkMode ? '#9CA3AF' : '#6B7280'} fontSize={12} />
        <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
        <Bar dataKey="messages" fill="#3B82F6" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

// ==================== المكون الرئيسي Dashboard ====================
function Dashboard({ token, darkMode }) {
  const [serverStats, setServerStats] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [ping, setPing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activityData, setActivityData] = useState([]);
  const [messagesDistribution, setMessagesDistribution] = useState([]);

  const fetchMessagesDistribution = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/stats/messages-distribution', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      const roomColors = {
        general: '#3B82F6',
        tech: '#8B5CF6',
        random: '#10B981',
        gaming: '#F59E0B'
      };
      
      const distribution = data.map(item => ({
        name: item.room_name.charAt(0).toUpperCase() + item.room_name.slice(1),
        value: parseInt(item.message_count),
        color: roomColors[item.room_name] || '#6B7280'
      }));
      
      setMessagesDistribution(distribution);
    } catch (error) {
      console.error('Error fetching messages distribution:', error);
    }
  };

  const fetchUserActivity = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/stats/user-activity', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data && data.length > 0) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const activityByDay = {
          Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0
        };
        
        data.forEach(item => {
          const date = new Date(item.date);
          const dayName = dayNames[date.getDay()];
          activityByDay[dayName] += parseInt(item.count);
        });
        
        const chartData = Object.keys(activityByDay).map(day => ({
          name: day,
          messages: activityByDay[day]
        }));
        
        setActivityData(chartData);
      } else {
        setActivityData([]);
      }
    } catch (error) {
      console.error('Error fetching user activity:', error);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [serverRes, userRes, pingRes] = await Promise.all([
        fetch('http://localhost:5000/api/stats/server', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/stats/user', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/stats/ping', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const serverData = await serverRes.json();
      const userData = await userRes.json();
      const pingData = await pingRes.json();

      setServerStats(serverData);
      setUserStats(userData);
      setPing(pingData);
      
      await fetchUserActivity();
      await fetchMessagesDistribution();
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4">
            <div className="w-full h-full border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: HiChartPie },
    { id: 'analytics', label: 'Analytics', icon: HiTrendingUp },
    { id: 'performance', label: 'Performance', icon: HiChartSquareBar },
    { id: 'insights', label: 'Insights', icon: HiChip },
  ];

  const getPerformanceStatus = (ms, type) => {
    if (type === 'server') {
      if (ms < 50) return { text: 'Excellent', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
      if (ms < 100) return { text: 'Good', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
      return { text: 'Poor', color: 'text-red-500', bg: 'bg-red-500/10' };
    } else {
      if (ms < 20) return { text: 'Fast', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
      if (ms < 50) return { text: 'Moderate', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
      return { text: 'Slow', color: 'text-red-500', bg: 'bg-red-500/10' };
    }
  };

  const avgMessagesPerUser = Math.round((serverStats?.todayMessages || 0) / Math.max(serverStats?.onlineUsers || 1, 1));

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Real-time analytics and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Live Updates</span>
          </div>
          <button onClick={fetchStats} className={`p-2.5 rounded-xl transition-all duration-300 hover:rotate-180 ${darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-200 hover:shadow-md'}`}>
            <HiRefresh className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className={`rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-wrap gap-1 p-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : `${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`
                }`}
              >
                <Icon size={16} />
                <span className="text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard icon={HiUsers} title="Online Users" value={serverStats?.onlineUsers || 0} subtext="Currently active" color="blue" darkMode={darkMode} />
              <StatCard icon={HiChat} title="Messages Today" value={serverStats?.todayMessages || 0} subtext="Last 24 hours" color="purple" darkMode={darkMode} />
              <StatCard icon={HiArchive} title="Total Backups" value={serverStats?.totalBackups || 0} subtext="System backups" color="emerald" darkMode={darkMode} />
              <StatCard icon={HiDatabase} title="Storage Used" value={245} subtext="of 1TB (24.5%)" color="orange" darkMode={darkMode} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={`rounded-2xl p-5 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <HiChartBar className={`text-lg ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Message Activity</h3>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Last 7 days</p>
                  </div>
                </div>
                <ActivityAreaChart data={activityData} darkMode={darkMode} />
              </div>

              <div className={`rounded-2xl p-5 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <HiChartPie className={`text-lg ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Messages Distribution</h3>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>By channel</p>
                  </div>
                </div>
                <CustomPieChart data={messagesDistribution} darkMode={darkMode} />
              </div>
            </div>

            <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className={`px-5 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <HiTable className={`text-lg ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Messages</h3>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Latest activity in all channels</p>
                  </div>
                </div>
              </div>
              <RecentMessagesTable messages={serverStats?.recentMessages} darkMode={darkMode} />
            </div>
          </>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && userStats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <StatCard icon={HiChat} title="Total Messages" value={userStats.totalMessages || 0} subtext="All time" color="blue" darkMode={darkMode} />
              <StatCard icon={HiArchive} title="Your Backups" value={userStats.totalBackups || 0} subtext="Saved snapshots" color="purple" darkMode={darkMode} />
              <StatCard icon={HiClock} title="Avg Response" value={2.4} subtext="Minutes" color="emerald" darkMode={darkMode} />
            </div>

            <div className={`rounded-2xl p-5 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <HiChartBar className={`text-lg ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div>
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Weekly Activity</h3>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Your messaging pattern</p>
                </div>
              </div>
              <ActivityBarChart data={activityData} darkMode={darkMode} />
            </div>

            {userStats.activity && userStats.activity.length > 0 && (
              <div className={`rounded-2xl p-5 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <HiCalendar className={`text-lg ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Daily Activity Log</h3>
                </div>
                <div className="space-y-3">
                  {userStats.activity.slice(0, 7).map((day, idx) => {
                    const maxCount = Math.max(...userStats.activity.map(d => d.count), 1);
                    const percentage = (day.count / maxCount) * 100;
                    return (
                      <div key={idx} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3 min-w-[140px]">
                          <HiCalendar className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex-1 flex items-center gap-3">
                          <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                          </div>
                          <span className={`text-sm font-medium min-w-[45px] text-right ${darkMode ? 'text-white' : 'text-gray-700'}`}>{day.count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

{/* Performance Tab */}
{activeTab === 'performance' && ping && (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Server Performance */}
      <div className={`rounded-2xl p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <HiServer className="text-white text-lg" />
          </div>
          <div>
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Server Performance</h3>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Response time metrics</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Response Time</span>
              <span className={`text-sm font-bold ${getPerformanceStatus(ping.serverTime, 'server').color}`}>{ping.serverTime}ms</span>
            </div>
            {/* ✅ إصلاح خلفية شريط التقدم */}
            <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  ping.serverTime < 50 ? 'bg-emerald-500' : 
                  ping.serverTime < 100 ? 'bg-yellow-500' : 
                  'bg-red-500'
                }`} 
                style={{ width: `${Math.min(100, (ping.serverTime / 200) * 100)}%` }} 
              />
            </div>
          </div>
          <div className={`p-3 rounded-xl ${getPerformanceStatus(ping.serverTime, 'server').bg}`}>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${getPerformanceStatus(ping.serverTime, 'server').color}`}>Status: {getPerformanceStatus(ping.serverTime, 'server').text}</span>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Database Performance */}
      <div className={`rounded-2xl p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <HiDatabase className="text-white text-lg" />
          </div>
          <div>
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Database Performance</h3>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Query execution time</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Query Time</span>
              <span className={`text-sm font-bold ${getPerformanceStatus(ping.dbTime, 'db').color}`}>{ping.dbTime}ms</span>
            </div>
            {/* ✅ إصلاح خلفية شريط التقدم */}
            <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  ping.dbTime < 20 ? 'bg-emerald-500' : 
                  ping.dbTime < 50 ? 'bg-yellow-500' : 
                  'bg-red-500'
                }`} 
                style={{ width: `${Math.min(100, (ping.dbTime / 100) * 100)}%` }} 
              />
            </div>
          </div>
          <div className={`p-3 rounded-xl ${getPerformanceStatus(ping.dbTime, 'db').bg}`}>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${getPerformanceStatus(ping.dbTime, 'db').color}`}>Status: {getPerformanceStatus(ping.dbTime, 'db').text}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* System Health */}
    <div className={`rounded-2xl p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-9 h-9 rounded-xl ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'} flex items-center justify-center`}>
          <HiChartSquareBar className={`text-lg ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
        </div>
        <div>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>System Health</h3>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Overall system status</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`flex justify-between items-center p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Server Uptime</span>
          <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{Math.floor(serverStats?.uptime / 60)}h {Math.floor(serverStats?.uptime % 60)}m</span>
        </div>
        <div className={`flex justify-between items-center p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Last Check</span>
          <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{lastUpdate.toLocaleTimeString()}</span>
        </div>
        <div className={`flex justify-between items-center p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Data Freshness</span>
          <span className="text-sm font-semibold text-emerald-500">Real-time</span>
        </div>
      </div>
    </div>
  </div>
)}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`rounded-2xl p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <HiTrendingUp className={`text-lg ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Key Insights</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <HiCheckCircle className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Peak Activity Hours</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Most messages sent between 2 PM - 6 PM</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                    <HiUsers className="text-purple-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>User Engagement</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Average {avgMessagesPerUser} messages per user daily</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                    <HiExclamationCircle className="text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recommendation</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {ping?.serverTime > 100 
                          ? 'Consider upgrading server for better performance during peak hours'
                          : 'System performance is optimal, keep up the good work!'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <HiShare className={`text-lg ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Quick Actions</h3>
                </div>
                <div className="space-y-3">
                  <button className={`w-full p-3 rounded-xl text-left transition-all border ${darkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'} group`}>
                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'} group-hover:text-blue-500 transition-colors`}>Export Analytics Report</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>Download CSV with all metrics</p>
                  </button>
                  <button className={`w-full p-3 rounded-xl text-left transition-all border ${darkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'} group`}>
                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'} group-hover:text-blue-500 transition-colors`}>Schedule Performance Audit</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>Get detailed system analysis</p>
                  </button>
                </div>
              </div>
            </div>

            <div className={`rounded-2xl p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <HiBell className={`text-lg ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                </div>
                <div>
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>System Notifications</h3>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Important updates and alerts</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className={`text-sm flex-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>System backup completed successfully</p>
                  <span className="text-xs text-blue-500">2 min ago</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <p className={`text-sm flex-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>New user joined #general</p>
                  <span className="text-xs text-emerald-500">15 min ago</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Last Update Timestamp */}
      <div className="text-right">
        <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>Last updated: {lastUpdate.toLocaleTimeString()}</p>
      </div>
    </div>
  );
}

export default Dashboard;