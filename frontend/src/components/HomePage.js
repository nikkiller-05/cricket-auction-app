import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const HomePage = () => {
  const navigate = useNavigate();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
  const response = await axios.post(`${API_BASE_URL}/api/auth/login`, credentials);
      localStorage.setItem('adminToken', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      // UPDATED: Redirect to setup instead of dashboard
      navigate('/setup');
    } catch (error) {
      console.error('Login error:', error);
      setLoginError(error.response?.data?.error || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleViewerAccess = () => {
    navigate('/dashboard', { state: { isAdmin: false } });
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="pt-8 pb-4">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-4 tracking-tight">
              🏏 Cricket Auction
            </h1>
            <p className="text-xl md:text-2xl text-blue-200 font-light">
              Experience the thrill of live player auctions
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="max-w-lg w-full">
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 border border-white border-opacity-20">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">Welcome to the Auction</h2>
                <p className="text-blue-200">
                  {showAdminLogin 
                    ? 'Login as admin to set up and manage the auction' 
                    : 'Choose how you want to participate'
                  }
                </p>
              </div>

              {!showAdminLogin ? (
                // Role Selection
                <div className="space-y-4">
                  <button
                    onClick={handleViewerAccess}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <div className="flex items-center justify-center">
                      <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Enter as Spectator
                    </div>
                    <div className="text-sm opacity-90 mt-1">Watch live auction & view team squads</div>
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white border-opacity-30" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-transparent text-blue-200">or</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowAdminLogin(true)}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <div className="flex items-center justify-center">
                      <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Admin Setup
                    </div>
                    <div className="text-sm opacity-90 mt-1">Set up & manage auction</div>
                  </button>
                </div>
              ) : (
                // Admin Login Form
                <form onSubmit={handleAdminLogin} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      required
                      className="w-full px-4 py-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      placeholder="Enter username"
                      value={credentials.username}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      required
                      className="w-full px-4 py-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      placeholder="Enter password"
                      value={credentials.password}
                      onChange={handleChange}
                    />
                  </div>

                  {loginError && (
                    <div className="text-red-300 text-sm text-center bg-red-500 bg-opacity-20 p-3 rounded-lg">
                      {loginError}
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAdminLogin(false);
                        setLoginError('');
                        setCredentials({ username: '', password: '' });
                      }}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300"
                    >
                      {loginLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Signing in...
                        </div>
                      ) : (
                        'Sign In'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Features Preview */}
            <div className="mt-8 text-center">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white bg-opacity-5 rounded-lg p-4">
                  <div className="text-3xl mb-2">⚡</div>
                  <h5 className="text-white font-medium mb-2">Real-Time Updates</h5>
                  <p className="text-blue-200 text-sm">Live bidding with instant updates</p>
                </div>
                <div className="bg-white bg-opacity-5 rounded-lg p-4">
                  <div className="text-3xl mb-2">📊</div>
                  <h5 className="text-white font-medium mb-2">Live Statistics</h5>
                  <p className="text-blue-200 text-sm">Comprehensive auction analytics</p>
                </div>
                <div className="bg-white bg-opacity-5 rounded-lg p-4">
                  <div className="text-3xl mb-2">🏏</div>
                  <h5 className="text-white font-medium mb-2">Team Management</h5>
                  <p className="text-blue-200 text-sm">Complete squad management</p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 text-center">
          <div className="max-w-6xl mx-auto px-4">
            <p className="text-blue-300 text-sm">
              © 2025 Cricket Auction Platform. Built with ❤️ for cricket enthusiasts.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;
