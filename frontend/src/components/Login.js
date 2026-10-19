import React, { useState, useEffect } from 'react';
import { 
  HiMail, 
  HiLockClosed, 
  HiUser, 
  HiUserAdd, 
  HiArrowRight, 
  HiCheckCircle, 
  HiEye, 
  HiEyeOff, 
  HiKey, 
  HiClipboardCopy 
} from 'react-icons/hi';

function Login({ onLogin, onRegister, isConnected }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // تحميل البيانات المحفوظة عند تحميل الصفحة
  useEffect(() => {
    const savedUsername = localStorage.getItem('saved_username');
    const savedRemember = localStorage.getItem('remember_me');
    if (savedRemember === 'true' && savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await onLogin(username, password);
        // حفظ البيانات إذا تم اختيار "تذكرني"
        if (rememberMe) {
          localStorage.setItem('saved_username', username);
          localStorage.setItem('remember_me', 'true');
        } else {
          localStorage.removeItem('saved_username');
          localStorage.removeItem('remember_me');
        }
      } else {
        await onRegister(username, email, password);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // منع autofill القديم باستخدام خاصية unique لكل حقل
  const randomId = Math.random().toString(36).substring(2, 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full opacity-10"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white rounded-full opacity-10"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-black opacity-5"></div>
      </div>

      <div className="relative w-full max-w-md my-8">
        {/* Logo / Brand */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-xl mb-3 transform transition hover:scale-105">
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              NX
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Nexus</h1>
          <p className="text-white text-opacity-80 text-xs">
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className={`flex-1 py-3 text-center text-sm font-medium transition-all duration-300 ${
                isLogin
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <HiUser className="inline mr-1.5" size={16} />
              Sign In
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError('');
                setRememberMe(false);
              }}
              className={`flex-1 py-3 text-center text-sm font-medium transition-all duration-300 ${
                !isLogin
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <HiUserAdd className="inline mr-1.5" size={16} />
              Sign Up
            </button>
          </div>

          {/* Form */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-gray-700 text-xs font-medium mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <HiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    id={`username_${randomId}`}
                    name={`username_${randomId}`}
                    autoComplete="off"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>

              {/* Email (only for register) */}
              {!isLogin && (
                <div>
                  <label className="block text-gray-700 text-xs font-medium mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <HiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      id={`email_${randomId}`}
                      name={`email_${randomId}`}
                      autoComplete="off"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-gray-700 text-xs font-medium mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <HiLockClosed className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id={`password_${randomId}`}
                    name={`password_${randomId}`}
                    autoComplete="off"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <HiEyeOff size={18} /> : <HiEye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (only for register) */}
              {!isLogin && (
                <div>
                  <label className="block text-gray-700 text-xs font-medium mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <HiCheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id={`confirm_${randomId}`}
                      name={`confirm_${randomId}`}
                      autoComplete="off"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                      placeholder="Confirm your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <HiEyeOff size={18} /> : <HiEye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Remember Me - فقط في وضع تسجيل الدخول */}
              {isLogin && (
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-600">Remember me</span>
                  </label>
                  <a href="#" className="text-xs text-blue-600 hover:text-blue-700">
                    Forgot password?
                  </a>
                </div>
              )}

              {/* Demo Account Section - Enhanced */}
              {isLogin && (
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-4">
                  {/* خلفية زخرفية */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-blue-500 rounded-full opacity-10"></div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-blue-600 p-1.5 rounded-lg">
                      <HiKey className="text-white" size={14} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800">Demo Credentials</h3>
                  </div>
                  
                  <div className="flex gap-2 mb-3">
                    <div className="flex-1 bg-white rounded-lg p-2 border border-gray-200 shadow-sm">
                      <span className="text-[9px] text-gray-500 uppercase block font-semibold">Username</span>
                      <span className="text-sm font-mono font-medium text-gray-800">Admin</span>
                    </div>
                    <div className="flex-1 bg-white rounded-lg p-2 border border-gray-200 shadow-sm">
                      <span className="text-[9px] text-gray-500 uppercase block font-semibold">Password</span>
                      <span className="text-sm font-mono font-medium text-gray-800">admin123</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setUsername('Admin');
                      setPassword('admin123');
                      setError('');
                    }}
                    className="w-full py-2 bg-white text-blue-600 text-xs font-semibold rounded-lg border border-blue-200 hover:bg-blue-600 hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <HiClipboardCopy size={14} />
                    Fill Demo Credentials
                  </button>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-xs text-center">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <HiArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Server Status */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-[10px] text-gray-500">
                  Server {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-4">
          <p className="text-white text-opacity-60 text-[10px]">
            Secure authentication • Encrypted connection
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;