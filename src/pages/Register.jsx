import React, { useState } from 'react';
import api from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Register(){
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [passwordError, setPasswordError] = useState('');
  const nav = useNavigate();

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (file) {
      setProfilePhoto(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  function validatePassword() {
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  }

  function handlePasswordChange(value) {
    setPassword(value);
    if (confirmPassword && value !== confirmPassword) {
      setPasswordError('Passwords do not match');
    } else {
      setPasswordError('');
    }
  }

  function handleConfirmPasswordChange(value) {
    setConfirmPassword(value);
    if (password && value !== password) {
      setPasswordError('Passwords do not match');
    } else {
      setPasswordError('');
    }
  }

  async function submit(e){
    e.preventDefault();
    
    // Validate passwords match
    if (!validatePassword()) {
      return;
    }

    try{
      const formData = new FormData();
      formData.append('firstName', firstName);
      formData.append('middleName', middleName);
      formData.append('lastName', lastName);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('phoneNumber', phoneNumber);
      formData.append('role', 'customer');
      if (gender) {
        formData.append('gender', gender);
      }
      if (profilePhoto) {
        formData.append('profilePhoto', profilePhoto);
      }

      const res = await api.post('/api/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      localStorage.setItem('kelale_token', res.data.token);
      localStorage.setItem('kelale_user', JSON.stringify(res.data.user));
      // Dispatch event to update user state in App
      window.dispatchEvent(new Event('userUpdated'));
      alert('Registered successfully!');
      nav('/');
    }catch(e){ 
      alert('Registration failed: '+(e?.response?.data?.message || e?.response?.data?.error || e.message)); 
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      {/* Logo and Title */}
      <div className="text-center mb-8">
        <div className="flex flex-col items-center justify-center gap-4 mb-4">
          <img 
            src="/logo.svg" 
            alt="Kelale Transport Logo" 
            className="h-20 w-auto"
          />
          <h1 className="text-3xl font-bold text-yellow-400">
            KELALE TRANSPORT
          </h1>
        </div>
        <p className="text-gray-400 text-sm">Book intercity buses across Ethiopia</p>
      </div>

      {/* Register Form */}
      <div className="bg-gray-900 rounded-lg p-6 shadow-lg border-2 border-yellow-400">
        <h2 className="text-2xl font-bold mb-6 text-yellow-400 text-center">Register</h2>
        
        <form onSubmit={submit} className="space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-yellow-400 text-sm font-semibold mb-2">First Name *</label>
              <input 
                value={firstName} 
                onChange={e=>setFirstName(e.target.value)} 
                placeholder="First Name" 
                required
                className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400" 
              />
            </div>
            <div>
              <label className="block text-yellow-400 text-sm font-semibold mb-2">Middle Name</label>
              <input 
                value={middleName} 
                onChange={e=>setMiddleName(e.target.value)} 
                placeholder="Middle Name" 
                className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400" 
              />
            </div>
            <div>
              <label className="block text-yellow-400 text-sm font-semibold mb-2">Last Name *</label>
              <input 
                value={lastName} 
                onChange={e=>setLastName(e.target.value)} 
                placeholder="Last Name" 
                required
                className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400" 
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-yellow-400 text-sm font-semibold mb-2">Email *</label>
            <input 
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
              type="email"
              placeholder="Enter your email" 
              required
              className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400" 
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-yellow-400 text-sm font-semibold mb-2">Phone Number</label>
            <input 
              value={phoneNumber} 
              onChange={e=>setPhoneNumber(e.target.value)} 
              type="tel"
              placeholder="Enter your phone number" 
              className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400" 
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-yellow-400 text-sm font-semibold mb-2">Gender (Optional)</label>
            <select
              value={gender}
              onChange={e=>setGender(e.target.value)}
              className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="block text-yellow-400 text-sm font-semibold mb-2">Password *</label>
            <input 
              type="password" 
              value={password} 
              onChange={e=>handlePasswordChange(e.target.value)} 
              placeholder="Enter your password" 
              required
              className={`w-full p-3 border-2 rounded-lg bg-black text-yellow-400 placeholder-gray-500 focus:outline-none focus:ring-2 ${
                passwordError ? 'border-red-500 focus:ring-red-500' : 'border-yellow-400 focus:ring-yellow-400'
              }`}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-yellow-400 text-sm font-semibold mb-2">Confirm Password *</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={e=>handleConfirmPasswordChange(e.target.value)} 
              placeholder="Confirm your password" 
              required
              className={`w-full p-3 border-2 rounded-lg bg-black text-yellow-400 placeholder-gray-500 focus:outline-none focus:ring-2 ${
                passwordError ? 'border-red-500 focus:ring-red-500' : 'border-yellow-400 focus:ring-yellow-400'
              }`}
            />
            {passwordError && (
              <p className="text-red-400 text-xs mt-1">{passwordError}</p>
            )}
          </div>
          
          {/* Profile Photo */}
          <div>
            <label className="block text-yellow-400 text-sm font-semibold mb-2">Profile Photo (Optional)</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={handlePhotoChange}
              className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            {photoPreview && (
              <div className="mt-3">
                <img 
                  src={photoPreview} 
                  alt="Preview" 
                  className="w-24 h-24 object-cover rounded-lg border-2 border-yellow-400"
                />
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="w-full bg-yellow-400 text-black p-3 rounded-lg font-bold hover:bg-yellow-500 transition-colors"
          >
            Register
          </button>

          <div className="text-center mt-4">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-yellow-400 hover:text-yellow-300 underline font-semibold">
                Login here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
