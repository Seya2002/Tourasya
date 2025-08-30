'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FiEye, FiEyeOff } from 'react-icons/fi';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'user' | 'admin'>('user');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [userPasswordVisible, setUserPasswordVisible] = useState(false);
  const [adminPasswordVisible, setAdminPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login, loading: authLoading } = useAuth();

  const handleLogin = async (e: React.FormEvent, isAdmin: boolean) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    const email = isAdmin ? adminEmail : userEmail;
    const password = isAdmin ? adminPassword : userPassword;
    try {
      await login(email, password);
      setSuccess('Login successful! Redirecting...');
      // Navigation will be handled by AuthContext
    } catch (error: unknown) {
      let errorMessage = 'Login failed. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('auth/invalid-credential')) {
          errorMessage = 'Incorrect email or password. Please check your credentials and try again.';
        } else if (error.message.includes('auth/user-not-found')) {
          errorMessage = 'No account found with this email address. Please check your email or create a new account.';
        } else if (error.message.includes('auth/wrong-password')) {
          errorMessage = 'Incorrect password. Please check your password and try again.';
        } else if (error.message.includes('auth/invalid-email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (error.message.includes('auth/too-many-requests')) {
          errorMessage = 'Too many failed login attempts. Please try again later.';
        } else if (error.message.includes('auth/user-disabled')) {
          errorMessage = 'This account has been disabled. Please contact support.';
        } else if (error.message.includes('auth/network-request-failed')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else {
          errorMessage = 'Please enter correct login details.';
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-6">
        <div className="flex justify-between border-b pb-4 mb-2">
          <button
            onClick={() => setActiveTab('user')}
            className={`w-1/2 text-center py-2 font-semibold ${
              activeTab === 'user' ? 'text-blue-950 border-b-2 border-blue-950' : 'text-gray-500'
            }`}
          >
            User Login
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`w-1/2 text-center py-2 font-semibold ${
              activeTab === 'admin' ? 'text-blue-950 border-b-2 border-blue-950' : 'text-gray-500'
            }`}
          >
            Admin Login
          </button>
        </div>
        <div className="text-center pb-2">
          <h2 className="text-2xl font-bold text-gray-800">{activeTab === 'admin' ? 'Admin Login' : 'User Login'}</h2>
          <p className="text-gray-600 mt-2">Enter your credentials to access the system</p>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">{success}</span>
            </div>
          </div>
        )}
        {activeTab === 'user' ? (
          <form className="space-y-4" onSubmit={e => handleLogin(e, false)}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={userEmail}
                onChange={e => setUserEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
                placeholder="user@example.com"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type={userPasswordVisible ? 'text' : 'password'}
                required
                value={userPassword}
                onChange={e => setUserPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-2 top-8 transform -translate-y-1/2 text-gray-500 hover:text-blue-900"
                onClick={() => setUserPasswordVisible(v => !v)}
                aria-label={userPasswordVisible ? 'Hide password' : 'Show password'}
              >
                {userPasswordVisible ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading || authLoading}
              className="w-full bg-blue-950 text-white py-2 rounded-md hover:bg-blue-900 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading || authLoading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={e => handleLogin(e, true)}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
                placeholder="admin@example.com"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type={adminPasswordVisible ? 'text' : 'password'}
                required
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-2 top-8 transform -translate-y-1/2 text-gray-500 hover:text-blue-900"
                onClick={() => setAdminPasswordVisible(v => !v)}
                aria-label={adminPasswordVisible ? 'Hide password' : 'Show password'}
              >
                {adminPasswordVisible ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading || authLoading}
              className="w-full bg-blue-950 text-white py-2 rounded-md hover:bg-blue-900 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading || authLoading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}