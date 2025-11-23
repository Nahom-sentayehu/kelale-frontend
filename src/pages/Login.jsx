import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Login(){
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const nav = useNavigate();

  async function submit(e){
    e.preventDefault();
    setIsLoggingIn(true);
    try{
      const res = await api.post('/api/auth/login',{email,password});
      localStorage.setItem('kelale_token', res.data.token);
      localStorage.setItem('kelale_user', JSON.stringify(res.data.user));
      setLoggedInUser(res.data.user);
      // Dispatch event to update user state in App
      window.dispatchEvent(new Event('userUpdated'));
      
      // Show success animation
      setShowSuccess(true);
      
      // Redirect after animation
      setTimeout(() => {
        nav('/');
      }, 3000);
    }catch(e){ 
      setIsLoggingIn(false);
      alert('Login failed: '+(e?.response?.data?.message || e?.response?.data?.msg || e.message)); 
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    if (!forgotEmail) {
      alert('Please enter your email address');
      return;
    }
    
    setForgotLoading(true);
    try {
      // Try to call forgot password endpoint if it exists
      await api.post('/api/auth/forgot-password', { email: forgotEmail });
      alert('Password reset instructions have been sent to your email');
      setShowForgotPassword(false);
      setForgotEmail('');
    } catch(e) {
      // If endpoint doesn't exist, show a helpful message
      if (e?.response?.status === 404) {
        alert('Password reset feature is not yet available. Please contact support.');
      } else {
        alert('Error: ' + (e?.response?.data?.message || e?.response?.data?.error || e.message));
      }
    }
    setForgotLoading(false);
  }

  // Success Animation Component
  if (showSuccess && loggedInUser) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          {/* Success Checkmark Animation */}
          <div className="relative mb-8">
            <div className="w-32 h-32 mx-auto">
              {/* Outer Circle */}
              <div className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-pulse"></div>
              {/* Inner Circle */}
              <div className="absolute inset-4 rounded-full bg-yellow-400 animate-scale-in"></div>
              {/* Checkmark */}
              <svg 
                className="absolute inset-0 w-full h-full text-black animate-checkmark"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={4} 
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="space-y-4 animate-slide-up">
            <h2 className="text-4xl font-bold text-yellow-400 animate-bounce-in">
              Welcome Back!
            </h2>
            <p className="text-2xl text-white font-semibold">
              {loggedInUser.firstName ? `${loggedInUser.firstName} ${loggedInUser.lastName || ''}`.trim() : loggedInUser.name || loggedInUser.email}
            </p>
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <svg className="w-5 h-5 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="animate-pulse">Redirecting to home...</span>
            </div>
          </div>

          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl animate-float-delayed"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      {/* Logo and Title */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="flex flex-col items-center justify-center gap-4 mb-4">
          <img 
            src="/logo.svg" 
            alt="Kelale Transport Logo" 
            className="h-20 w-auto animate-bounce-in"
          />
          <h1 className="text-3xl font-bold text-yellow-400 animate-slide-down">
            KELALE TRANSPORT
          </h1>
        </div>
        <p className="text-gray-400 text-sm animate-fade-in-delayed">Book intercity buses across Ethiopia</p>
      </div>

      {/* Login Form */}
      <div className="bg-gray-900 rounded-lg p-6 shadow-lg border-2 border-yellow-400">
        <h2 className="text-2xl font-bold mb-6 text-yellow-400 text-center">Login</h2>
        
        {!showForgotPassword ? (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-yellow-400 text-sm font-semibold mb-2">Email</label>
              <input 
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
                type="email"
                placeholder="Enter your email" 
                required
                className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400" 
              />
            </div>
            <div>
              <label className="block text-yellow-400 text-sm font-semibold mb-2">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                placeholder="Enter your password" 
                required
                className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400" 
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-yellow-400 hover:text-yellow-300 text-sm underline"
              >
                Forgot Password?
              </button>
            </div>
            <button 
              type="submit" 
              disabled={isLoggingIn}
              className="w-full bg-yellow-400 text-black p-3 rounded-lg font-bold hover:bg-yellow-500 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden"
            >
              {isLoggingIn ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                'Login'
              )}
            </button>
            <div className="text-center mt-4">
              <p className="text-gray-400 text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="text-yellow-400 hover:text-yellow-300 underline font-semibold">
                  Register here
                </Link>
              </p>
            </div>
          </form>
        ) : (
          <div>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-yellow-400 text-sm font-semibold mb-2">Email</label>
                <input 
                  value={forgotEmail} 
                  onChange={e=>setForgotEmail(e.target.value)} 
                  type="email"
                  placeholder="Enter your email address" 
                  required
                  className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400" 
                />
                <p className="text-gray-400 text-xs mt-2">
                  We'll send you instructions to reset your password
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotEmail('');
                  }}
                  className="flex-1 bg-gray-700 text-yellow-400 p-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={forgotLoading}
                  className="flex-1 bg-yellow-400 text-black p-3 rounded-lg font-bold hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
