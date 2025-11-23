import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Profile(){
  const [user,setUser] = useState(null);
  const [bookings,setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUser, setEditingUser] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: ''
  });
  const [updating, setUpdating] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);

  function calculateAge(dateOfBirth) {
    if (!dateOfBirth) return '';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  }

  useEffect(()=>{
    const u = localStorage.getItem('kelale_user');
    if(u) {
      const userData = JSON.parse(u);
      setUser(userData);
      setEditingUser({
        firstName: userData.firstName || '',
        middleName: userData.middleName || '',
        lastName: userData.lastName || '',
        phoneNumber: userData.phoneNumber || '',
        dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().split('T')[0] : '',
        gender: userData.gender || ''
      });
    }
    async function loadBookings(){
      try{
        const token = localStorage.getItem('kelale_token');
        const res = await api.get('/api/bookings/user', { headers: { Authorization: 'Bearer '+token }});
        setBookings(res.data);
      }catch(e){ console.error(e); }
      finally {
        setLoading(false);
      }
    }
    loadBookings();
  },[]);

  function handleDateOfBirthChange(dateOfBirth) {
    setEditingUser({...editingUser, dateOfBirth});
  }

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setUpdating(true);
    try {
      const token = localStorage.getItem('kelale_token');
      const formData = new FormData();
      formData.append('firstName', editingUser.firstName);
      if (editingUser.middleName) formData.append('middleName', editingUser.middleName);
      formData.append('lastName', editingUser.lastName);
      if (editingUser.phoneNumber) formData.append('phoneNumber', editingUser.phoneNumber);
      if (editingUser.dateOfBirth) formData.append('dateOfBirth', editingUser.dateOfBirth);
      if (editingUser.gender) formData.append('gender', editingUser.gender);
      if (profilePhoto) formData.append('profilePhoto', profilePhoto);

      const res = await api.put('/api/auth/profile', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update local storage
      localStorage.setItem('kelale_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      setIsEditing(false);
      setProfilePhoto(null);
      window.dispatchEvent(new Event('userUpdated'));
      alert('Profile updated successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to update profile: ' + (e?.response?.data?.error || e?.response?.data?.message || e.message));
    } finally {
      setUpdating(false);
    }
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getStatusColor(status) {
    switch(status?.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  }

  function isPastTrip(booking) {
    if (!booking.schedule?.departure) return false;
    const departureDate = new Date(booking.schedule.departure);
    return departureDate < new Date();
  }

  function isCompletedTrip(booking) {
    const status = booking.status?.toLowerCase();
    return status === 'completed' || status === 'confirmed';
  }

  // Separate bookings into active and travel history
  const activeBookings = bookings.filter(booking => 
    !isPastTrip(booking) && booking.status?.toLowerCase() !== 'cancelled'
  );
  
  const travelHistory = bookings.filter(booking => 
    (isPastTrip(booking) && booking.status?.toLowerCase() !== 'cancelled') || 
    isCompletedTrip(booking)
  ).sort((a, b) => {
    // Sort by departure date, most recent first
    const dateA = a.schedule?.departure ? new Date(a.schedule.departure) : new Date(0);
    const dateB = b.schedule?.departure ? new Date(b.schedule.departure) : new Date(0);
    return dateB - dateA;
  });

  // Calculate travel statistics
  const totalTrips = travelHistory.length;
  const totalSpent = travelHistory.reduce((sum, booking) => sum + (booking.total || 0), 0);
  const totalDistance = travelHistory.reduce((sum, booking) => 
    sum + (parseInt(booking.route?.distance) || 0), 0
  );

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-gray-900 rounded-lg p-8 text-center border-2 border-yellow-400">
          <p className="text-yellow-400 text-lg">Please login to view your profile.</p>
          <Link to="/login" className="mt-4 inline-block bg-yellow-400 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-colors">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const fullName = user.firstName && user.lastName 
    ? `${user.firstName}${user.middleName ? ' ' + user.middleName : ''} ${user.lastName}` 
    : user.name;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl p-8 mb-8 border-2 border-yellow-400">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          {/* Profile Photo */}
          <div className="relative">
            {user.profilePhoto ? (
              <img 
                src={`${API_BASE_URL}${user.profilePhoto}`} 
                alt="Profile" 
                className="w-32 h-32 rounded-full object-cover border-4 border-yellow-400 shadow-lg"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-yellow-400/20 border-4 border-yellow-400 flex items-center justify-center">
                <span className="text-5xl text-yellow-400">
                  {fullName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full border-4 border-gray-900"></div>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-yellow-400 mb-2">{fullName}</h1>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-300">
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{user.email}</span>
              </div>
              {user.phoneNumber && (
                <div className="flex items-center gap-2 text-gray-300">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{user.phoneNumber}</span>
                </div>
              )}
              {user.dateOfBirth && (
                <div className="flex items-center gap-2 text-gray-300">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>
                    Date of Birth: {new Date(user.dateOfBirth).toLocaleDateString()}
                    {(() => {
                      const age = calculateAge(user.dateOfBirth);
                      return age ? ` (Age: ${age} years)` : '';
                    })()}
                  </span>
                </div>
              )}
              {user.gender && (
                <div className="flex items-center gap-2 text-gray-300">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Gender: {user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="inline-block bg-yellow-400/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-semibold border border-yellow-400">
                  {user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'Customer'}
                </span>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-yellow-400 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
                >
                  {isEditing ? 'Cancel Editing' : 'Edit Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      {isEditing && (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl p-8 mb-8 border-2 border-yellow-400">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">Edit Profile Information</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">First Name *</label>
                <input
                  type="text"
                  value={editingUser.firstName}
                  onChange={e => setEditingUser({...editingUser, firstName: e.target.value})}
                  required
                  className="w-full p-3 rounded-lg bg-black border-2 border-gray-700 text-white focus:outline-none focus:border-yellow-400"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Middle Name</label>
                <input
                  type="text"
                  value={editingUser.middleName}
                  onChange={e => setEditingUser({...editingUser, middleName: e.target.value})}
                  className="w-full p-3 rounded-lg bg-black border-2 border-gray-700 text-white focus:outline-none focus:border-yellow-400"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Last Name *</label>
                <input
                  type="text"
                  value={editingUser.lastName}
                  onChange={e => setEditingUser({...editingUser, lastName: e.target.value})}
                  required
                  className="w-full p-3 rounded-lg bg-black border-2 border-gray-700 text-white focus:outline-none focus:border-yellow-400"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={editingUser.phoneNumber}
                  onChange={e => setEditingUser({...editingUser, phoneNumber: e.target.value})}
                  placeholder="09XX XXX XXXX"
                  className="w-full p-3 rounded-lg bg-black border-2 border-gray-700 text-white focus:outline-none focus:border-yellow-400"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Date of Birth</label>
                <input
                  type="date"
                  value={editingUser.dateOfBirth}
                  onChange={e => handleDateOfBirthChange(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 rounded-lg bg-black border-2 border-gray-700 text-white focus:outline-none focus:border-yellow-400"
                />
                {editingUser.dateOfBirth && (
                  <p className="text-gray-400 text-xs mt-1">
                    Age: {calculateAge(editingUser.dateOfBirth)} years
                  </p>
                )}
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Gender</label>
                <select
                  value={editingUser.gender}
                  onChange={e => setEditingUser({...editingUser, gender: e.target.value})}
                  className="w-full p-3 rounded-lg bg-black border-2 border-gray-700 text-white focus:outline-none focus:border-yellow-400"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Profile Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => setProfilePhoto(e.target.files[0])}
                className="w-full p-3 rounded-lg bg-black border-2 border-gray-700 text-white focus:outline-none focus:border-yellow-400"
              />
              {profilePhoto && (
                <p className="text-gray-400 text-xs mt-1">Selected: {profilePhoto.name}</p>
              )}
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={updating}
                className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Updating...' : 'Update Profile'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setProfilePhoto(null);
                  // Reset form
                  const u = localStorage.getItem('kelale_user');
                  if(u) {
                    const userData = JSON.parse(u);
                    setEditingUser({
                      firstName: userData.firstName || '',
                      middleName: userData.middleName || '',
                      lastName: userData.lastName || '',
                      phoneNumber: userData.phoneNumber || '',
                      dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().split('T')[0] : '',
                      gender: userData.gender || ''
                    });
                  }
                }}
                className="bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Travel History Section */}
      {travelHistory.length > 0 && (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl p-8 mb-8 border-2 border-yellow-400">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              Travel History
            </h2>
            <span className="bg-yellow-400/20 text-yellow-400 px-4 py-1 rounded-full text-sm font-semibold border border-yellow-400">
              {totalTrips} {totalTrips === 1 ? 'Trip' : 'Trips'}
            </span>
          </div>

          {/* Travel Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-black/30 rounded-lg p-4 border border-yellow-400/30">
              <div className="text-gray-400 text-sm mb-1">Total Trips</div>
              <div className="text-yellow-400 font-bold text-2xl">{totalTrips}</div>
            </div>
            <div className="bg-black/30 rounded-lg p-4 border border-yellow-400/30">
              <div className="text-gray-400 text-sm mb-1">Total Distance</div>
              <div className="text-yellow-400 font-bold text-2xl">
                {totalDistance > 0 ? `${totalDistance} km` : 'N/A'}
              </div>
            </div>
            <div className="bg-black/30 rounded-lg p-4 border border-yellow-400/30">
              <div className="text-gray-400 text-sm mb-1">Total Spent</div>
              <div className="text-yellow-400 font-bold text-2xl">ETB {totalSpent.toLocaleString()}</div>
            </div>
          </div>

          {/* Travel History List */}
          <div className="space-y-4">
            {travelHistory.map(booking => (
              <div 
                key={booking._id} 
                className="bg-black/30 rounded-lg p-6 border-2 border-gray-700 hover:border-yellow-400 transition-all hover:shadow-lg"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-yellow-400 mb-2">
                          {booking.route?.from || 'N/A'} → {booking.route?.to || 'N/A'}
                        </h3>
                        {booking.route?.company?.name && (
                          <p className="text-gray-400 text-sm mb-2">
                            {booking.route.company.name}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(booking.status)}`}>
                          {booking.status || 'Completed'}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {formatDate(booking.schedule?.departure || booking.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-black/30 rounded-lg p-3">
                        <div className="text-gray-400 text-xs mb-1">Seats</div>
                        <div className="text-yellow-400 font-semibold">
                          {booking.seats && booking.seats.length > 0 
                            ? booking.seats.join(', ') 
                            : 'N/A'}
                        </div>
                      </div>
                      <div className="bg-black/30 rounded-lg p-3">
                        <div className="text-gray-400 text-xs mb-1">Amount Paid</div>
                        <div className="text-yellow-400 font-semibold text-lg">
                          ETB {booking.total || '0'}
                        </div>
                      </div>
                      {booking.schedule?.departure && (
                        <div className="bg-black/30 rounded-lg p-3">
                          <div className="text-gray-400 text-xs mb-1">Departure</div>
                          <div className="text-white font-semibold">
                            {formatDate(booking.schedule.departure)}
                          </div>
                        </div>
                      )}
                      {booking.schedule?.arrival && (
                        <div className="bg-black/30 rounded-lg p-3">
                          <div className="text-gray-400 text-xs mb-1">Arrival</div>
                          <div className="text-white font-semibold">
                            {formatDate(booking.schedule.arrival)}
                          </div>
                        </div>
                      )}
                      {booking.route?.distance && (
                        <div className="bg-black/30 rounded-lg p-3">
                          <div className="text-gray-400 text-xs mb-1">Distance</div>
                          <div className="text-white font-semibold">
                            {booking.route.distance} km
                          </div>
                        </div>
                      )}
                      {booking.bus?.plate && (
                        <div className="bg-black/30 rounded-lg p-3">
                          <div className="text-gray-400 text-xs mb-1">Bus Plate</div>
                          <div className="text-white font-semibold">
                            {booking.bus.plate}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Bookings Section */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl p-8 border-2 border-yellow-400">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Active Bookings
          </h2>
          <span className="bg-yellow-400/20 text-yellow-400 px-4 py-1 rounded-full text-sm font-semibold border border-yellow-400">
            {activeBookings.length} {activeBookings.length === 1 ? 'Booking' : 'Bookings'}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
            <p className="text-gray-400 mt-4">Loading bookings...</p>
          </div>
        ) : activeBookings.length === 0 ? (
          <div className="text-center py-12 bg-black/30 rounded-lg border-2 border-dashed border-yellow-400/50">
            <svg className="w-16 h-16 text-yellow-400/50 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-400 text-lg mb-4">No active bookings</p>
            <Link 
              to="/" 
              className="inline-block bg-yellow-400 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
            >
              Book a Trip
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {activeBookings.map(booking => (
              <div 
                key={booking._id} 
                className="bg-black/30 rounded-lg p-6 border-2 border-gray-700 hover:border-yellow-400 transition-all hover:shadow-lg"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Route Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-yellow-400 mb-2">
                          {booking.route?.from || 'N/A'} → {booking.route?.to || 'N/A'}
                        </h3>
                        {booking.route?.company?.name && (
                          <p className="text-gray-400 text-sm mb-2">
                            {booking.route.company.name}
                          </p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(booking.status)}`}>
                        {booking.status || 'Pending'}
                      </span>
                    </div>

                    {/* Booking Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-black/30 rounded-lg p-3">
                        <div className="text-gray-400 text-xs mb-1">Seats</div>
                        <div className="text-yellow-400 font-semibold">
                          {booking.seats && booking.seats.length > 0 
                            ? booking.seats.join(', ') 
                            : 'N/A'}
                        </div>
                      </div>
                      <div className="bg-black/30 rounded-lg p-3">
                        <div className="text-gray-400 text-xs mb-1">Total Amount</div>
                        <div className="text-yellow-400 font-semibold text-lg">
                          ETB {booking.total || '0'}
                        </div>
                      </div>
                      {booking.schedule?.departure && (
                        <div className="bg-black/30 rounded-lg p-3">
                          <div className="text-gray-400 text-xs mb-1">Departure</div>
                          <div className="text-white font-semibold">
                            {formatDate(booking.schedule.departure)}
                          </div>
                        </div>
                      )}
                      {booking.schedule?.arrival && (
                        <div className="bg-black/30 rounded-lg p-3">
                          <div className="text-gray-400 text-xs mb-1">Arrival</div>
                          <div className="text-white font-semibold">
                            {formatDate(booking.schedule.arrival)}
                          </div>
                        </div>
                      )}
                      {booking.createdAt && (
                        <div className="bg-black/30 rounded-lg p-3">
                          <div className="text-gray-400 text-xs mb-1">Booked On</div>
                          <div className="text-white text-sm">
                            {formatDate(booking.createdAt)}
                          </div>
                        </div>
                      )}
                      {booking.bus?.plate && (
                        <div className="bg-black/30 rounded-lg p-3">
                          <div className="text-gray-400 text-xs mb-1">Bus Plate</div>
                          <div className="text-white font-semibold">
                            {booking.bus.plate}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* QR Code if available */}
                    {booking.qrCode && (
                      <div className="mt-4 bg-white p-3 rounded-lg inline-block">
                        <img src={booking.qrCode} alt="QR Code" className="w-32 h-32" />
                        <p className="text-gray-400 text-xs mt-2 text-center">Ticket QR Code</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
