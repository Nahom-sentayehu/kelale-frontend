import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Admin(){
  const [activeTab, setActiveTab] = useState('dashboard');
  const [companies,setCompanies] = useState([]);
  const [buses,setBuses] = useState([]);
  const [routes,setRoutes] = useState([]);
  const [companyUsers, setCompanyUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Company registration form
  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [companyContact, setCompanyContact] = useState('');
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [companyLogo, setCompanyLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  
  // Password reset form
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetCompanyId, setResetCompanyId] = useState('');

  // Bookings filter/search
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [bookingDateFilter, setBookingDateFilter] = useState('all');

  useEffect(()=>{ loadAll(); },[]);

  async function loadAll(){
    try{
      setLoading(true);
      const [c, b, r, users, bookings] = await Promise.all([
        api.get('/api/companies'),
        api.get('/api/buses'),
        api.get('/api/routes'),
        api.get('/api/users'),
        api.get('/api/bookings')
      ]);
      setCompanies(c.data);
      setBuses(b.data);
      setRoutes(r.data);
      setAllBookings(bookings.data || []);
      // Filter company users
      const companyUsersList = users.data.filter(u => u.role === 'company');
      setCompanyUsers(companyUsersList);
      // Filter customers
      const customersList = users.data.filter(u => u.role === 'customer');
      setCustomers(customersList);
    }catch(e){ 
      console.error(e);
      if (e?.response?.status === 403) {
        // Bookings endpoint might not be accessible, that's okay
        setAllBookings([]);
      }
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(e) {
    e.preventDefault();
    try {
      if (!resetEmail || !newPassword) {
        alert('Please fill all fields');
        return;
      }
      
      const res = await api.put('/api/users/reset-password', {
        email: resetEmail,
        newPassword: newPassword
      });
      
      setResetEmail('');
      setNewPassword('');
      setResetCompanyId('');
      alert('Password reset successfully!');
    } catch (e) {
      alert('Failed to reset password: ' + (e?.response?.data?.message || e.message));
    }
  }
  
  function selectCompanyForReset(company) {
    if (company.user) {
      setResetEmail(company.user.email || '');
      setResetCompanyId(company._id);
    } else {
      const user = companyUsers.find(u => {
        const userId = typeof company.user === 'object' ? company.user._id : company.user;
        return u._id === userId || u.email === (company.user?.email || '');
      });
      if (user) {
        setResetEmail(user.email);
        setResetCompanyId(company._id);
      }
    }
  }

  function handleLogoChange(e) {
    const file = e.target.files[0];
    if (file) {
      setCompanyLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  async function addCompany(e){
    e.preventDefault();
    try{
      if (!companyName || !userFirstName || !userLastName || !userEmail || !userPassword) {
        alert('Please fill all required fields');
        return;
      }
      
      const formData = new FormData();
      formData.append('name', companyName);
      formData.append('description', companyDescription);
      formData.append('contact', companyContact);
      formData.append('userFirstName', userFirstName);
      formData.append('userLastName', userLastName);
      formData.append('userEmail', userEmail);
      formData.append('userPassword', userPassword);
      formData.append('userPhoneNumber', userPhone);
      if (companyLogo) {
        formData.append('logo', companyLogo);
      }
      
      const res = await api.post('/api/companies', formData);
      
      // Reset form
      setCompanyName('');
      setCompanyDescription('');
      setCompanyContact('');
      setUserFirstName('');
      setUserLastName('');
      setUserEmail('');
      setUserPassword('');
      setUserPhone('');
      setCompanyLogo(null);
      setLogoPreview(null);
      
      loadAll();
      alert(`Company "${res.data.company.name}" created! User credentials:\nEmail: ${res.data.user.email}\nPassword: (as entered)`);
    }catch(e){ 
      const errorMsg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Unknown error';
      const statusCode = e?.response?.status;
      alert(`Failed to add company (${statusCode || 'N/A'}): ${errorMsg}`); 
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

  // Filter bookings
  const filteredBookings = allBookings.filter(booking => {
    const matchesSearch = !bookingSearch || 
      booking.route?.from?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      booking.route?.to?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      booking.user?.email?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      booking.user?.name?.toLowerCase().includes(bookingSearch.toLowerCase());
    
    const matchesStatus = bookingStatusFilter === 'all' || 
      booking.status?.toLowerCase() === bookingStatusFilter.toLowerCase();
    
    const matchesDate = bookingDateFilter === 'all' || (() => {
      if (!booking.createdAt) return false;
      const bookingDate = new Date(booking.createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now - bookingDate) / (1000 * 60 * 60 * 24));
      
      switch(bookingDateFilter) {
        case 'today': return daysDiff === 0;
        case 'week': return daysDiff <= 7;
        case 'month': return daysDiff <= 30;
        default: return true;
      }
    })();
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Calculate analytics
  const totalRevenue = allBookings
    .filter(b => b.status?.toLowerCase() !== 'cancelled')
    .reduce((sum, b) => sum + (b.total || 0), 0);
  
  const confirmedBookings = allBookings.filter(b => 
    b.status?.toLowerCase() === 'confirmed' || b.status?.toLowerCase() === 'completed'
  ).length;
  
  const pendingBookings = allBookings.filter(b => 
    b.status?.toLowerCase() === 'pending'
  ).length;
  
  const cancelledBookings = allBookings.filter(b => 
    b.status?.toLowerCase() === 'cancelled'
  ).length;

  // Popular routes
  const routeCounts = {};
  allBookings.forEach(booking => {
    if (booking.route) {
      const routeKey = `${booking.route.from} → ${booking.route.to}`;
      routeCounts[routeKey] = (routeCounts[routeKey] || 0) + 1;
    }
  });
  const popularRoutes = Object.entries(routeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([route, count]) => ({ route, count }));

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'bookings', label: 'All Bookings', icon: '🎫' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'register-company', label: 'Register Company', icon: '➕' },
    { id: 'password-reset', label: 'Reset Password', icon: '🔑' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-yellow-400 mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Manage your transport system</p>
      </div>
      
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b-2 border-yellow-400/30">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-yellow-400 text-black border-b-4 border-yellow-400 rounded-t-lg'
                : 'text-yellow-400 hover:bg-gray-800 rounded-t-lg'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      ) : (
        <>
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border-2 border-yellow-400 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl">🏢</div>
                    <div className="text-yellow-400 text-sm font-semibold">Companies</div>
                  </div>
                  <div className="text-3xl font-bold text-yellow-400">{companies.length}</div>
                </div>
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border-2 border-yellow-400 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl">🚌</div>
                    <div className="text-yellow-400 text-sm font-semibold">Buses</div>
                  </div>
                  <div className="text-3xl font-bold text-yellow-400">{buses.length}</div>
                </div>
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border-2 border-yellow-400 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl">🛣️</div>
                    <div className="text-yellow-400 text-sm font-semibold">Routes</div>
                  </div>
                  <div className="text-3xl font-bold text-yellow-400">{routes.length}</div>
                </div>
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border-2 border-yellow-400 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl">👥</div>
                    <div className="text-yellow-400 text-sm font-semibold">Customers</div>
                  </div>
                  <div className="text-3xl font-bold text-yellow-400">{customers.length}</div>
                </div>
              </div>

              {/* Companies List */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border-2 border-yellow-400 shadow-lg">
                <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                  <span>🏢</span> Companies
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {companies.map(c => (
                    <div key={c._id} className="bg-black/30 rounded-lg p-4 border border-yellow-400/30 hover:border-yellow-400 transition-all">
                      <div className="flex items-center gap-3 mb-2">
                        {c.logo && (
                          <img
                            src={`${API_BASE_URL}${c.logo}`}
                            alt={c.name}
                            className="w-12 h-12 object-contain rounded bg-white p-1 border border-yellow-400"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-semibold text-yellow-400">{c.name}</div>
                          {c.description && (
                            <div className="text-sm text-gray-400 line-clamp-1">{c.description}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {companies.length === 0 && (
                    <div className="col-span-full text-center text-gray-400 py-8">No companies yet.</div>
                  )}
                </div>
              </div>

              {/* Recent Items */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border-2 border-yellow-400 shadow-lg">
                  <h3 className="text-xl font-bold text-yellow-400 mb-4">Recent Buses</h3>
                  <div className="space-y-2">
                    {buses.slice(0, 5).map(b => (
                      <div key={b._id} className="bg-black/30 rounded-lg p-3 text-yellow-400 border border-yellow-400/30">
                        <div className="font-semibold">{b.plate}</div>
                        <div className="text-sm text-gray-400">{b.seats} seats • {b.type}</div>
                      </div>
                    ))}
                    {buses.length === 0 && <div className="text-gray-400 text-center py-4">No buses yet.</div>}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border-2 border-yellow-400 shadow-lg">
                  <h3 className="text-xl font-bold text-yellow-400 mb-4">Recent Routes</h3>
                  <div className="space-y-2">
                    {routes.slice(0, 5).map(r => (
                      <div key={r._id} className="bg-black/30 rounded-lg p-3 text-yellow-400 border border-yellow-400/30">
                        <div className="font-semibold">{r.from} → {r.to}</div>
                        <div className="text-sm text-gray-400">ETB {r.price}</div>
                      </div>
                    ))}
                    {routes.length === 0 && <div className="text-gray-400 text-center py-4">No routes yet.</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Bookings Tab - NEW FEATURE 1 */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border-2 border-yellow-400 shadow-lg">
                <h2 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center gap-2">
                  <span>🎫</span> All Bookings Management
                </h2>
                
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-yellow-400 text-sm font-semibold mb-2">Search</label>
                    <input
                      type="text"
                      value={bookingSearch}
                      onChange={e => setBookingSearch(e.target.value)}
                      placeholder="Search by route, customer..."
                      className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-yellow-400 text-sm font-semibold mb-2">Status</label>
                    <select
                      value={bookingStatusFilter}
                      onChange={e => setBookingStatusFilter(e.target.value)}
                      className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-yellow-400 text-sm font-semibold mb-2">Date Range</label>
                    <select
                      value={bookingDateFilter}
                      onChange={e => setBookingDateFilter(e.target.value)}
                      className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">Last 7 Days</option>
                      <option value="month">Last 30 Days</option>
                    </select>
                  </div>
                </div>

                {/* Bookings List */}
                <div className="space-y-4">
                  {filteredBookings.length === 0 ? (
                    <div className="text-center py-12 bg-black/30 rounded-lg border-2 border-dashed border-yellow-400/50">
                      <p className="text-gray-400 text-lg">No bookings found</p>
                    </div>
                  ) : (
                    filteredBookings.map(booking => (
                      <div key={booking._id} className="bg-black/30 rounded-lg p-6 border-2 border-gray-700 hover:border-yellow-400 transition-all">
                        <div className="flex flex-col lg:flex-row gap-6">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="text-xl font-bold text-yellow-400 mb-2">
                                  {booking.route?.from || 'N/A'} → {booking.route?.to || 'N/A'}
                                </h3>
                                <p className="text-gray-400 text-sm">
                                  Customer: {booking.user?.name || booking.user?.email || 'N/A'}
                                </p>
                                {booking.route?.company?.name && (
                                  <p className="text-gray-400 text-sm">Company: {booking.route.company.name}</p>
                                )}
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(booking.status)}`}>
                                {booking.status || 'Pending'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="bg-black/30 rounded-lg p-3">
                                <div className="text-gray-400 text-xs mb-1">Seats</div>
                                <div className="text-yellow-400 font-semibold">
                                  {booking.seats?.join(', ') || 'N/A'}
                                </div>
                              </div>
                              <div className="bg-black/30 rounded-lg p-3">
                                <div className="text-gray-400 text-xs mb-1">Amount</div>
                                <div className="text-yellow-400 font-semibold">ETB {booking.total || '0'}</div>
                              </div>
                              <div className="bg-black/30 rounded-lg p-3">
                                <div className="text-gray-400 text-xs mb-1">Booked On</div>
                                <div className="text-white text-sm">{formatDate(booking.createdAt)}</div>
                              </div>
                              <div className="bg-black/30 rounded-lg p-3">
                                <div className="text-gray-400 text-xs mb-1">Payment</div>
                                <div className="text-white text-sm">{booking.paymentMethod || 'N/A'}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* System Analytics Tab - NEW FEATURE 2 */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Revenue Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border-2 border-yellow-400 shadow-lg">
                  <div className="text-gray-400 text-sm mb-2">Total Revenue</div>
                  <div className="text-3xl font-bold text-yellow-400">ETB {totalRevenue.toLocaleString()}</div>
                </div>
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border-2 border-green-500 shadow-lg">
                  <div className="text-gray-400 text-sm mb-2">Confirmed Bookings</div>
                  <div className="text-3xl font-bold text-green-400">{confirmedBookings}</div>
                </div>
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border-2 border-yellow-500 shadow-lg">
                  <div className="text-gray-400 text-sm mb-2">Pending Bookings</div>
                  <div className="text-3xl font-bold text-yellow-400">{pendingBookings}</div>
                </div>
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border-2 border-red-500 shadow-lg">
                  <div className="text-gray-400 text-sm mb-2">Cancelled Bookings</div>
                  <div className="text-3xl font-bold text-red-400">{cancelledBookings}</div>
                </div>
              </div>

              {/* Popular Routes */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border-2 border-yellow-400 shadow-lg">
                <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                  <span>⭐</span> Most Popular Routes
                </h3>
                <div className="space-y-3">
                  {popularRoutes.length > 0 ? (
                    popularRoutes.map((item, index) => (
                      <div key={index} className="bg-black/30 rounded-lg p-4 border border-yellow-400/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center text-yellow-400 font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-semibold text-yellow-400">{item.route}</div>
                              <div className="text-sm text-gray-400">{item.count} bookings</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 py-8">No route data available</div>
                  )}
                </div>
              </div>

              {/* Booking Status Distribution */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border-2 border-yellow-400 shadow-lg">
                <h3 className="text-xl font-bold text-yellow-400 mb-4">Booking Status Distribution</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">Confirmed/Completed</span>
                      <span className="text-green-400 font-semibold">{confirmedBookings}</span>
                    </div>
                    <div className="w-full bg-black/30 rounded-full h-3">
                      <div 
                        className="bg-green-500 h-3 rounded-full transition-all"
                        style={{ width: `${allBookings.length > 0 ? (confirmedBookings / allBookings.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">Pending</span>
                      <span className="text-yellow-400 font-semibold">{pendingBookings}</span>
                    </div>
                    <div className="w-full bg-black/30 rounded-full h-3">
                      <div 
                        className="bg-yellow-500 h-3 rounded-full transition-all"
                        style={{ width: `${allBookings.length > 0 ? (pendingBookings / allBookings.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">Cancelled</span>
                      <span className="text-red-400 font-semibold">{cancelledBookings}</span>
                    </div>
                    <div className="w-full bg-black/30 rounded-full h-3">
                      <div 
                        className="bg-red-500 h-3 rounded-full transition-all"
                        style={{ width: `${allBookings.length > 0 ? (cancelledBookings / allBookings.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Register Company Tab */}
          {activeTab === 'register-company' && (
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 border-2 border-yellow-400 shadow-lg">
              <h3 className="text-2xl font-bold text-yellow-400 mb-6">Register New Company</h3>
              <form onSubmit={addCompany} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-yellow-400 text-sm font-semibold mb-2">Company Name *</label>
                    <input 
                      value={companyName} 
                      onChange={e=>setCompanyName(e.target.value)} 
                      className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400" 
                      placeholder="Company name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-yellow-400 text-sm font-semibold mb-2">Contact</label>
                    <input 
                      value={companyContact} 
                      onChange={e=>setCompanyContact(e.target.value)} 
                      className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400" 
                      placeholder="Phone/Email"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-yellow-400 text-sm font-semibold mb-2">Description</label>
                  <textarea 
                    value={companyDescription} 
                    onChange={e=>setCompanyDescription(e.target.value)} 
                    className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400" 
                    placeholder="Company description"
                    rows="3"
                  />
                </div>
                
                <div>
                  <label className="block text-yellow-400 text-sm font-semibold mb-2">Company Logo (Optional)</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                  {logoPreview && (
                    <div className="mt-3">
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="w-32 h-32 object-contain rounded-lg border-2 border-yellow-400 bg-white p-2"
                      />
                    </div>
                  )}
                </div>
                
                <div className="border-t-2 border-yellow-400/30 pt-6 mt-6">
                  <h4 className="font-semibold text-yellow-400 mb-4 text-lg">Company User Account</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-yellow-400 text-sm font-semibold mb-2">First Name *</label>
                      <input 
                        value={userFirstName} 
                        onChange={e=>setUserFirstName(e.target.value)} 
                        className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400" 
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-yellow-400 text-sm font-semibold mb-2">Last Name *</label>
                      <input 
                        value={userLastName} 
                        onChange={e=>setUserLastName(e.target.value)} 
                        className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400" 
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-yellow-400 text-sm font-semibold mb-2">Email *</label>
                      <input 
                        type="email"
                        value={userEmail} 
                        onChange={e=>setUserEmail(e.target.value)} 
                        className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400" 
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-yellow-400 text-sm font-semibold mb-2">Phone</label>
                      <input 
                        value={userPhone} 
                        onChange={e=>setUserPhone(e.target.value)} 
                        className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400" 
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-yellow-400 text-sm font-semibold mb-2">Password *</label>
                      <input 
                        type="password"
                        value={userPassword} 
                        onChange={e=>setUserPassword(e.target.value)} 
                        className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400" 
                        required
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-yellow-400 text-black px-6 py-3 rounded-lg font-bold hover:bg-yellow-500 transition-colors mt-6"
                >
                  Register Company
                </button>
              </form>
            </div>
          )}

          {/* Password Reset Tab */}
          {activeTab === 'password-reset' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 border-2 border-yellow-400 shadow-lg">
                <h3 className="text-2xl font-bold text-yellow-400 mb-6">Reset Company User Password</h3>
                <form onSubmit={resetPassword} className="space-y-4">
                  <div>
                    <label className="block text-yellow-400 text-sm font-semibold mb-2">Select Company</label>
                    <select
                      value={resetCompanyId}
                      onChange={e => {
                        setResetCompanyId(e.target.value);
                        const company = companies.find(c => c._id === e.target.value);
                        if (company) {
                          selectCompanyForReset(company);
                        }
                      }}
                      className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                      <option value="">Select a company...</option>
                      {companies.map(c => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-yellow-400 text-sm font-semibold mb-2">Company User Email *</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="user@company.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-yellow-400 text-sm font-semibold mb-2">New Password *</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="Enter new password"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-yellow-400 text-black px-6 py-3 rounded-lg font-bold hover:bg-yellow-500 transition-colors"
                  >
                    Reset Password
                  </button>
                </form>
              </div>

              {/* Company Users List */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border-2 border-yellow-400 shadow-lg">
                <h3 className="text-xl font-bold text-yellow-400 mb-4">Company Users</h3>
                <div className="space-y-3">
                  {companies.map(company => {
                    const companyUser = company.user || companyUsers.find(u => {
                      const userId = typeof company.user === 'object' ? company.user?._id : company.user;
                      return u._id === userId;
                    });
                    
                    return (
                      <div key={company._id} className="bg-black/30 rounded-lg p-4 border border-yellow-400/30 flex justify-between items-center">
                        <div className="text-yellow-400">
                          <div className="font-semibold">{company.name}</div>
                          {companyUser && (
                            <div className="text-sm text-gray-400">
                              {companyUser.email || 'N/A'} ({companyUser.name || 'N/A'})
                            </div>
                          )}
                          {!companyUser && (
                            <div className="text-sm text-red-400">No user assigned</div>
                          )}
                        </div>
                        {companyUser && (
                          <button
                            onClick={() => {
                              selectCompanyForReset(company);
                              setActiveTab('password-reset');
                            }}
                            className="bg-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-500 transition-colors"
                          >
                            Reset Password
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {companies.length === 0 && <div className="text-gray-400 text-center py-8">No companies yet.</div>}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
