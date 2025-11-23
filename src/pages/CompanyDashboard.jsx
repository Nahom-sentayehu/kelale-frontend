import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function CompanyDashboard() {
  const [company, setCompany] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [companyBookings, setCompanyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Form states
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [showBusForm, setShowBusForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  
  // Route form
  const [routeFrom, setRouteFrom] = useState('');
  const [routeTo, setRouteTo] = useState('');
  const [routePrice, setRoutePrice] = useState('');
  const [routeDuration, setRouteDuration] = useState('');
  const [routeBusId, setRouteBusId] = useState('');
  const [routeAvailableSeats, setRouteAvailableSeats] = useState('');
  const [routeBusImage, setRouteBusImage] = useState(null);
  const [routeBusImagePreview, setRouteBusImagePreview] = useState(null);
  const [editingRoute, setEditingRoute] = useState(null);
  const [cities, setCities] = useState([]);
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [routeDistance, setRouteDistance] = useState(null);
  
  // Bus form
  const [busPlate, setBusPlate] = useState('');
  const [busSeats, setBusSeats] = useState('');
  const [busType, setBusType] = useState('Standard');
  const [busImage, setBusImage] = useState(null);
  const [busImagePreview, setBusImagePreview] = useState(null);
  const [editingBus, setEditingBus] = useState(null);
  
  // Company logo editing
  const [showLogoEdit, setShowLogoEdit] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  
  // Schedule form
  const [scheduleRouteId, setScheduleRouteId] = useState('');
  const [scheduleBusId, setScheduleBusId] = useState('');
  const [scheduleDeparture, setScheduleDeparture] = useState('');
  const [scheduleArrival, setScheduleArrival] = useState('');
  const [scheduleDepartureDate, setScheduleDepartureDate] = useState('');
  const [scheduleDepartureTime, setScheduleDepartureTime] = useState('');
  const [scheduleArrivalDate, setScheduleArrivalDate] = useState('');
  const [scheduleArrivalTime, setScheduleArrivalTime] = useState('');
  const [scheduleSeatsLeft, setScheduleSeatsLeft] = useState('');
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [showDepartureCalendar, setShowDepartureCalendar] = useState(false);
  const [showArrivalCalendar, setShowArrivalCalendar] = useState(false);
  const [departureCalendarMonth, setDepartureCalendarMonth] = useState(new Date().getMonth());
  const [departureCalendarYear, setDepartureCalendarYear] = useState(new Date().getFullYear());
  const [arrivalCalendarMonth, setArrivalCalendarMonth] = useState(new Date().getMonth());
  const [arrivalCalendarYear, setArrivalCalendarYear] = useState(new Date().getFullYear());

  // Bookings filter
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [activeBookingSearch, setActiveBookingSearch] = useState('');
  const [activeBookingStatusFilter, setActiveBookingStatusFilter] = useState('all');
  
  // Initialize active filters on component mount or when bookings change
  useEffect(() => {
    // Auto-apply filters if they're set but not active
    if (bookingStatusFilter !== 'all' && activeBookingStatusFilter === 'all' && companyBookings.length > 0) {
      // Don't auto-apply, wait for user to click search
    }
  }, [companyBookings]);

  useEffect(() => {
    loadData();
    loadCities();
  }, []);

  // Close calendars when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (showDepartureCalendar && !event.target.closest('.departure-calendar-container')) {
        setShowDepartureCalendar(false);
      }
      if (showArrivalCalendar && !event.target.closest('.arrival-calendar-container')) {
        setShowArrivalCalendar(false);
      }
    }

    if (showDepartureCalendar || showArrivalCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDepartureCalendar, showArrivalCalendar]);

  async function loadCities() {
    try {
      const res = await api.get('/api/routes/cities');
      setCities(res.data);
    } catch (e) {
      console.error('Error loading cities:', e);
    }
  }

  function handleFromChange(value) {
    setRouteFrom(value);
    if (value) {
      const filtered = cities.filter(city => 
        city.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 10);
      setFromSuggestions(filtered);
    } else {
      setFromSuggestions([]);
    }
    calculateDistance(value, routeTo);
  }

  function handleToChange(value) {
    setRouteTo(value);
    if (value) {
      const filtered = cities.filter(city => 
        city.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 10);
      setToSuggestions(filtered);
    } else {
      setToSuggestions([]);
    }
    calculateDistance(routeFrom, value);
  }

  async function calculateDistance(from, to) {
    if (from && to) {
      try {
        const res = await api.get(`/api/routes/distance?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
        setRouteDistance(res.data.distance);
      } catch (e) {
        setRouteDistance(null);
      }
    } else {
      setRouteDistance(null);
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      const [companyRes, routesRes, busesRes, schedulesRes] = await Promise.all([
        api.get('/api/companies/my-company'),
        api.get('/api/routes/my-routes'),
        api.get('/api/buses/my-buses'),
        api.get('/api/schedules/my-schedules')
      ]);
      setCompany(companyRes.data);
      setRoutes(routesRes.data);
      setBuses(busesRes.data);
      setSchedules(schedulesRes.data);
      
      // Load company bookings using company-specific endpoint
      try {
        const bookingsRes = await api.get('/api/bookings/company');
        const bookings = bookingsRes.data || [];
        console.log('Company bookings loaded:', bookings.length);
        
        // Debug: Check status distribution
        const statusCounts = {};
        bookings.forEach(b => {
          const status = String(b.status || 'pending').toLowerCase().trim();
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        console.log('Booking status distribution:', statusCounts);
        
        if (bookings.length > 0) {
          console.log('Sample booking:', {
            id: bookings[0]._id,
            status: bookings[0].status,
            route: bookings[0].route?.from + ' → ' + bookings[0].route?.to
          });
        }
        
        setCompanyBookings(bookings);
      } catch (e) {
        console.error('Error loading company bookings:', e);
        // Fallback: try to filter by routes if company endpoint doesn't work
        try {
          const allBookingsRes = await api.get('/api/bookings');
          const routeIds = routesRes.data.map(r => r._id);
          const filteredBookings = allBookingsRes.data.filter(booking => {
            if (!booking.route) return false;
            const routeId = booking.route._id || booking.route;
            return routeIds.some(rid => String(rid) === String(routeId));
          });
          setCompanyBookings(filteredBookings);
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          setCompanyBookings([]);
        }
      }
    } catch (e) {
      console.error(e);
      alert('Error loading data. Make sure you are logged in as a company user.');
    } finally {
      setLoading(false);
    }
  }

  function handleRouteBusImageChange(e) {
    const file = e.target.files[0];
    if (file) {
      setRouteBusImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setRouteBusImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleRouteSubmit(e) {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('from', routeFrom);
      formData.append('to', routeTo);
      formData.append('price', parseFloat(routePrice));
      formData.append('duration', routeDuration);
      if (routeDistance) {
        formData.append('distance', routeDistance);
      }
      if (routeBusId) {
        formData.append('bus', routeBusId);
      }
      if (routeAvailableSeats) {
        formData.append('availableSeats', parseInt(routeAvailableSeats));
      }
      if (routeBusImage) {
        formData.append('busImage', routeBusImage);
      }

      if (editingRoute) {
        await api.put(`/api/routes/${editingRoute._id}`, formData);
      } else {
        await api.post('/api/routes', formData);
      }
      resetRouteForm();
      loadData();
      alert(editingRoute ? 'Route updated successfully!' : 'Route created successfully!');
    } catch (e) {
      alert('Error saving route: ' + (e?.response?.data?.error || e.message));
    }
  }

  function handleLogoChange(e) {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleLogoSubmit(e) {
    e.preventDefault();
    if (!logoFile) {
      alert('Please select a logo image');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);
      await api.put('/api/companies/my-company/logo', formData);
      setShowLogoEdit(false);
      setLogoFile(null);
      setLogoPreview(null);
      loadData();
      alert('Logo updated successfully!');
    } catch (e) {
      alert('Error updating logo: ' + (e?.response?.data?.error || e.message));
    }
  }

  function handleBusImageChange(e) {
    const file = e.target.files[0];
    if (file) {
      setBusImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBusImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleBusSubmit(e) {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('plate', busPlate);
      formData.append('seats', busSeats);
      formData.append('type', busType);
      if (busImage) {
        formData.append('image', busImage);
      }

      if (editingBus) {
        await api.put(`/api/buses/${editingBus._id}`, formData);
      } else {
        await api.post('/api/buses', formData);
      }
      resetBusForm();
      loadData();
      alert(editingBus ? 'Bus updated successfully!' : 'Bus created successfully!');
    } catch (e) {
      alert('Error saving bus: ' + (e?.response?.data?.error || e.message));
    }
  }

  async function handleScheduleSubmit(e) {
    e.preventDefault();
    try {
      // Combine date and time for departure and arrival
      const departure = scheduleDepartureDate && scheduleDepartureTime 
        ? `${scheduleDepartureDate}T${scheduleDepartureTime}`
        : scheduleDeparture;
      const arrival = scheduleArrivalDate && scheduleArrivalTime 
        ? `${scheduleArrivalDate}T${scheduleArrivalTime}`
        : scheduleArrival;

      if (!departure || !arrival) {
        alert('Please select both departure and arrival date and time');
        return;
      }

      const scheduleData = {
        routeId: scheduleRouteId,
        busId: scheduleBusId,
        departure: departure,
        arrival: arrival
      };
      
      if (scheduleSeatsLeft) {
        scheduleData.seatsLeft = parseInt(scheduleSeatsLeft);
      }
      
      if (editingSchedule) {
        await api.put(`/api/schedules/${editingSchedule._id}`, {
          departure: departure,
          arrival: arrival,
          seatsLeft: scheduleSeatsLeft ? parseInt(scheduleSeatsLeft) : undefined
        });
      } else {
        await api.post('/api/schedules', scheduleData);
      }
      resetScheduleForm();
      loadData();
      alert(editingSchedule ? 'Schedule updated successfully!' : 'Schedule created successfully!');
    } catch (e) {
      alert('Error saving schedule: ' + (e?.response?.data?.error || e.message));
    }
  }

  function resetRouteForm() {
    setRouteFrom('');
    setRouteTo('');
    setRoutePrice('');
    setRouteDuration('');
    setRouteBusImage(null);
    setRouteBusImagePreview(null);
    setEditingRoute(null);
    setRouteDistance(null);
    setFromSuggestions([]);
    setToSuggestions([]);
    setRouteBusId('');
    setRouteAvailableSeats('');
    setShowRouteForm(false);
  }

  function resetBusForm() {
    setBusPlate('');
    setBusSeats('');
    setBusType('Standard');
    setBusImage(null);
    setBusImagePreview(null);
    setEditingBus(null);
    setShowBusForm(false);
  }

  function resetScheduleForm() {
    setScheduleRouteId('');
    setScheduleBusId('');
    setScheduleDeparture('');
    setScheduleArrival('');
    setScheduleDepartureDate('');
    setScheduleDepartureTime('');
    setScheduleArrivalDate('');
    setScheduleArrivalTime('');
    setScheduleSeatsLeft('');
    setEditingSchedule(null);
    setShowScheduleForm(false);
    setShowDepartureCalendar(false);
    setShowArrivalCalendar(false);
    setDepartureCalendarMonth(new Date().getMonth());
    setDepartureCalendarYear(new Date().getFullYear());
    setArrivalCalendarMonth(new Date().getMonth());
    setArrivalCalendarYear(new Date().getFullYear());
  }

  // Calendar helper functions
  function generateCalendarDays(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  }

  function isDatePast(year, month, day) {
    const date = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  function isDateSelected(year, month, day, selectedDate) {
    if (!selectedDate) return false;
    const date = new Date(year, month, day);
    const selected = new Date(selectedDate);
    return date.toDateString() === selected.toDateString();
  }

  function getDateDisplay(dateString) {
    if (!dateString) return { day: '', date: '' };
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      day: days[date.getDay()],
      date: `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
    };
  }

  function handleDepartureDateSelect(year, month, day) {
    const date = new Date(year, month, day);
    const dateString = date.toISOString().slice(0, 10);
    setScheduleDepartureDate(dateString);
    setShowDepartureCalendar(false);
    // Update departure datetime
    const time = scheduleDepartureTime || '00:00';
    setScheduleDeparture(`${dateString}T${time}`);
  }

  function handleArrivalDateSelect(year, month, day) {
    const date = new Date(year, month, day);
    const dateString = date.toISOString().slice(0, 10);
    setScheduleArrivalDate(dateString);
    setShowArrivalCalendar(false);
    // Update arrival datetime
    const time = scheduleArrivalTime || '00:00';
    setScheduleArrival(`${dateString}T${time}`);
  }

  function handleDepartureTimeChange(time) {
    setScheduleDepartureTime(time);
    if (scheduleDepartureDate) {
      setScheduleDeparture(`${scheduleDepartureDate}T${time}`);
    }
  }

  function handleArrivalTimeChange(time) {
    setScheduleArrivalTime(time);
    if (scheduleArrivalDate) {
      setScheduleArrival(`${scheduleArrivalDate}T${time}`);
    }
  }

  function navigateDepartureMonth(direction) {
    if (direction === 'prev') {
      if (departureCalendarMonth === 0) {
        setDepartureCalendarMonth(11);
        setDepartureCalendarYear(departureCalendarYear - 1);
      } else {
        setDepartureCalendarMonth(departureCalendarMonth - 1);
      }
    } else {
      if (departureCalendarMonth === 11) {
        setDepartureCalendarMonth(0);
        setDepartureCalendarYear(departureCalendarYear + 1);
      } else {
        setDepartureCalendarMonth(departureCalendarMonth + 1);
      }
    }
  }

  function navigateArrivalMonth(direction) {
    if (direction === 'prev') {
      if (arrivalCalendarMonth === 0) {
        setArrivalCalendarMonth(11);
        setArrivalCalendarYear(arrivalCalendarYear - 1);
      } else {
        setArrivalCalendarMonth(arrivalCalendarMonth - 1);
      }
    } else {
      if (arrivalCalendarMonth === 11) {
        setArrivalCalendarMonth(0);
        setArrivalCalendarYear(arrivalCalendarYear + 1);
      } else {
        setArrivalCalendarMonth(arrivalCalendarMonth + 1);
      }
    }
  }

  function editRoute(route) {
    setRouteFrom(route.from);
    setRouteTo(route.to);
    setRoutePrice(route.price);
    setRouteDuration(route.duration || '');
    setRouteBusId(route.bus?._id || route.bus || '');
    setRouteAvailableSeats(route.availableSeats || '');
    setRouteBusImage(null);
    setRouteBusImagePreview(route.busImage ? `${API_BASE_URL}${route.busImage}` : null);
    setRouteDistance(route.distance || null);
    setEditingRoute(route);
    setShowRouteForm(true);
    setActiveTab('routes');
  }

  function editBus(bus) {
    setBusPlate(bus.plate);
    setBusSeats(bus.seats);
    setBusType(bus.type || 'Standard');
    setBusImage(null);
    setBusImagePreview(bus.image ? `${API_BASE_URL}${bus.image}` : null);
    setEditingBus(bus);
    setShowBusForm(true);
    setActiveTab('buses');
  }

  function editSchedule(schedule) {
    setScheduleRouteId(schedule.route._id);
    setScheduleBusId(schedule.bus._id);
    const depDateTime = new Date(schedule.departure).toISOString().slice(0, 16);
    const arrDateTime = new Date(schedule.arrival).toISOString().slice(0, 16);
    setScheduleDeparture(depDateTime);
    setScheduleArrival(arrDateTime);
    setScheduleDepartureDate(depDateTime.slice(0, 10));
    setScheduleDepartureTime(depDateTime.slice(11, 16));
    setScheduleArrivalDate(arrDateTime.slice(0, 10));
    setScheduleArrivalTime(arrDateTime.slice(11, 16));
    setScheduleSeatsLeft(schedule.seatsLeft || '');
    setEditingSchedule(schedule);
    setShowScheduleForm(true);
    setActiveTab('schedules');
  }

  async function deleteRoute(id) {
    if (!confirm('Delete this route?')) return;
    try {
      await api.delete(`/api/routes/${id}`);
      loadData();
      alert('Route deleted successfully!');
    } catch (e) {
      alert('Error deleting route');
    }
  }

  async function deleteBus(id) {
    if (!confirm('Delete this bus?')) return;
    try {
      await api.delete(`/api/buses/${id}`);
      loadData();
      alert('Bus deleted successfully!');
    } catch (e) {
      alert('Error deleting bus');
    }
  }

  async function deleteSchedule(id) {
    if (!confirm('Delete this schedule?')) return;
    try {
      await api.delete(`/api/schedules/${id}`);
      loadData();
      alert('Schedule deleted successfully!');
    } catch (e) {
      alert('Error deleting schedule');
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

  // Handle search button click
  function handleBookingSearch() {
    setActiveBookingSearch(bookingSearch);
    setActiveBookingStatusFilter(bookingStatusFilter);
    
    // Debug logging
    console.log('Search clicked:', {
      search: bookingSearch,
      statusFilter: bookingStatusFilter,
      totalBookings: companyBookings.length,
      pendingBookings: companyBookings.filter(b => {
        const status = (b.status || 'pending').toLowerCase().trim();
        return status === 'pending';
      }).length
    });
  }

  // Filter bookings based on active search and status
  const filteredBookings = companyBookings.filter(booking => {
    // Search filter
    const matchesSearch = !activeBookingSearch || 
      booking.route?.from?.toLowerCase().includes(activeBookingSearch.toLowerCase()) ||
      booking.route?.to?.toLowerCase().includes(activeBookingSearch.toLowerCase()) ||
      booking.user?.email?.toLowerCase().includes(activeBookingSearch.toLowerCase()) ||
      booking.user?.name?.toLowerCase().includes(activeBookingSearch.toLowerCase()) ||
      booking.user?.firstName?.toLowerCase().includes(activeBookingSearch.toLowerCase()) ||
      booking.user?.lastName?.toLowerCase().includes(activeBookingSearch.toLowerCase());
    
    // Status filter - handle null/undefined/empty status as 'pending' (default)
    let bookingStatus = booking.status;
    if (!bookingStatus || bookingStatus === null || bookingStatus === undefined || bookingStatus === '') {
      bookingStatus = 'pending'; // Default status according to model
    }
    bookingStatus = String(bookingStatus).toLowerCase().trim();
    
    const filterStatus = String(activeBookingStatusFilter).toLowerCase().trim();
    const matchesStatus = filterStatus === 'all' || bookingStatus === filterStatus;
    
    // Debug log for pending filter
    if (activeBookingStatusFilter === 'pending' && bookingStatus === 'pending') {
      console.log('Pending booking found:', {
        id: booking._id,
        status: booking.status,
        normalizedStatus: bookingStatus,
        matchesSearch,
        matchesStatus
      });
    }
    
    return matchesSearch && matchesStatus;
  });

  // Calculate analytics
  const totalRevenue = companyBookings
    .filter(b => b.status?.toLowerCase() !== 'cancelled')
    .reduce((sum, b) => sum + (b.total || 0), 0);
  
  const confirmedBookings = companyBookings.filter(b => 
    b.status?.toLowerCase() === 'confirmed' || b.status?.toLowerCase() === 'completed'
  ).length;
  
  const pendingBookings = companyBookings.filter(b => 
    b.status?.toLowerCase() === 'pending'
  ).length;
  
  const cancelledBookings = companyBookings.filter(b => 
    b.status?.toLowerCase() === 'cancelled'
  ).length;

  // Popular routes
  const routeCounts = {};
  companyBookings.forEach(booking => {
    if (booking.route) {
      const routeKey = `${booking.route.from} → ${booking.route.to}`;
      routeCounts[routeKey] = (routeCounts[routeKey] || 0) + 1;
    }
  });
  const popularRoutes = Object.entries(routeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([route, count]) => ({ route, count }));

  // Get all unique customers from bookings
  const allCustomers = [];
  const customerMap = new Map();
  
  companyBookings.forEach(booking => {
    if (booking.user) {
      const userId = booking.user._id || booking.user.id || booking.user.email;
      if (!customerMap.has(userId)) {
        customerMap.set(userId, {
          user: booking.user,
          bookings: [],
          totalSpent: 0,
          totalBookings: 0
        });
      }
      const customer = customerMap.get(userId);
      customer.bookings.push(booking);
      customer.totalSpent += booking.total || 0;
      customer.totalBookings += 1;
    }
  });
  
  allCustomers.push(...Array.from(customerMap.values()));
  
  // Get pending customers
  const pendingCustomers = allCustomers.filter(customer => 
    customer.bookings.some(b => b.status?.toLowerCase() === 'pending')
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'routes', label: 'Routes', icon: '🛣️' },
    { id: 'buses', label: 'Buses', icon: '🚌' },
    { id: 'schedules', label: 'Schedules', icon: '📅' },
    { id: 'bookings', label: 'Bookings', icon: '🎫' },
    { id: 'customers', label: 'Customers', icon: '👥' },
    { id: 'analytics', label: 'Analytics', icon: '📈' }
  ];

  if (loading) {
  return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-yellow-400 mb-2">Company Dashboard</h1>
        <p className="text-gray-400">Manage your transport operations</p>
      </div>

      {/* Company Info Card */}
      {company && (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 mb-8 border-2 border-yellow-400 shadow-lg">
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0">
              {company.logo ? (
                <img
                  src={`${API_BASE_URL}${company.logo}`}
                  alt={company.name}
                  className="w-24 h-24 object-contain rounded-lg bg-white p-2 border-2 border-yellow-400"
                />
              ) : (
                <div className="w-24 h-24 rounded-lg bg-yellow-400/20 border-2 border-yellow-400 flex items-center justify-center">
                  <span className="text-3xl">🏢</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-yellow-400 mb-2">{company.name}</h2>
              {company.description && <p className="text-gray-300 mb-2">{company.description}</p>}
              {company.contact && <p className="text-gray-400 text-sm">Contact: {company.contact}</p>}
            </div>
              <button
                onClick={() => setShowLogoEdit(!showLogoEdit)}
              className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
              >
                {showLogoEdit ? 'Cancel' : 'Edit Logo'}
              </button>
          </div>
          
          {showLogoEdit && (
            <form onSubmit={handleLogoSubmit} className="mt-6 bg-black/30 rounded-lg p-4 border border-yellow-400/30">
              <label className="block text-yellow-400 text-sm font-semibold mb-2">Company Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
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
              <button type="submit" className="mt-4 bg-yellow-400 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-colors">
                Update Logo
              </button>
            </form>
          )}
        </div>
      )}

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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border-2 border-yellow-400 shadow-lg">
              <div className="text-gray-400 text-sm mb-2">Total Routes</div>
              <div className="text-3xl font-bold text-yellow-400">{routes.length}</div>
            </div>
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border-2 border-yellow-400 shadow-lg">
              <div className="text-gray-400 text-sm mb-2">Total Buses</div>
              <div className="text-3xl font-bold text-yellow-400">{buses.length}</div>
            </div>
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border-2 border-yellow-400 shadow-lg">
              <div className="text-gray-400 text-sm mb-2">Active Schedules</div>
              <div className="text-3xl font-bold text-yellow-400">{schedules.length}</div>
            </div>
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border-2 border-yellow-400 shadow-lg">
              <div className="text-gray-400 text-sm mb-2">Total Bookings</div>
              <div className="text-3xl font-bold text-yellow-400">{companyBookings.length}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border-2 border-yellow-400 shadow-lg">
              <h3 className="text-xl font-bold text-yellow-400 mb-4">Recent Routes</h3>
              <div className="space-y-2">
                {routes.slice(0, 5).map(r => (
                  <div key={r._id} className="bg-black/30 rounded-lg p-3 border border-yellow-400/30">
                    <div className="font-semibold text-yellow-400">{r.from} → {r.to}</div>
                    <div className="text-sm text-gray-400">ETB {r.price}</div>
                  </div>
                ))}
                {routes.length === 0 && <div className="text-gray-400 text-center py-4">No routes yet.</div>}
              </div>
            </div>
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border-2 border-yellow-400 shadow-lg">
              <h3 className="text-xl font-bold text-yellow-400 mb-4">Recent Schedules</h3>
              <div className="space-y-2">
                {schedules.slice(0, 5).map(s => (
                  <div key={s._id} className="bg-black/30 rounded-lg p-3 border border-yellow-400/30">
                    <div className="font-semibold text-yellow-400">{s.route?.from} → {s.route?.to}</div>
                    <div className="text-sm text-gray-400">{formatDate(s.departure)}</div>
                  </div>
                ))}
                {schedules.length === 0 && <div className="text-gray-400 text-center py-4">No schedules yet.</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Routes Tab */}
      {activeTab === 'routes' && (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 border-2 border-yellow-400 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-yellow-400">Routes Management</h2>
          <button
            onClick={() => { resetRouteForm(); setShowRouteForm(!showRouteForm); }}
              className="bg-yellow-400 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
          >
            {showRouteForm ? 'Cancel' : '+ Add Route'}
          </button>
        </div>

        {showRouteForm && (
            <form onSubmit={handleRouteSubmit} className="bg-black/30 rounded-lg p-6 mb-6 border border-yellow-400/30 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                  <label className="block text-yellow-400 text-sm font-semibold mb-2">From City *</label>
                <input
                  value={routeFrom}
                  onChange={e => handleFromChange(e.target.value)}
                  placeholder="From City"
                    className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                />
                {fromSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-800 border-2 border-yellow-400 rounded-lg max-h-40 overflow-y-auto">
                    {fromSuggestions.map(city => (
                      <div
                        key={city}
                        onClick={() => {
                          setRouteFrom(city);
                          setFromSuggestions([]);
                          calculateDistance(city, routeTo);
                        }}
                          className="p-2 hover:bg-yellow-400 hover:text-black cursor-pointer text-yellow-400"
                      >
                        {city}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                  <label className="block text-yellow-400 text-sm font-semibold mb-2">To City *</label>
                <input
                  value={routeTo}
                  onChange={e => handleToChange(e.target.value)}
                  placeholder="To City"
                    className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                />
                {toSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-800 border-2 border-yellow-400 rounded-lg max-h-40 overflow-y-auto">
                    {toSuggestions.map(city => (
                      <div
                        key={city}
                        onClick={() => {
                          setRouteTo(city);
                          setToSuggestions([]);
                          calculateDistance(routeFrom, city);
                        }}
                          className="p-2 hover:bg-yellow-400 hover:text-black cursor-pointer text-yellow-400"
                      >
                        {city}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {routeDistance !== null && (
                <div className="bg-yellow-400/20 text-yellow-400 p-3 rounded-lg border border-yellow-400">
                  <span className="font-semibold">Distance: {routeDistance} km</span>
              </div>
            )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-yellow-400 text-sm font-semibold mb-2">Price (ETB) *</label>
              <input
                type="number"
                value={routePrice}
                onChange={e => setRoutePrice(e.target.value)}
                    placeholder="Price"
                    className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                required
              />
                </div>
                <div>
                  <label className="block text-yellow-400 text-sm font-semibold mb-2">Duration</label>
              <input
                value={routeDuration}
                onChange={e => setRouteDuration(e.target.value)}
                    placeholder="e.g., 5 hours"
                    className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
              </div>
              <div>
                <label className="block text-yellow-400 text-sm font-semibold mb-2">Select Bus *</label>
              <select
                value={routeBusId}
                onChange={e => {
                  setRouteBusId(e.target.value);
                  const selectedBus = buses.find(b => b._id === e.target.value);
                  if (selectedBus && !routeAvailableSeats) {
                    setRouteAvailableSeats(selectedBus.seats);
                  }
                }}
                  className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                required
              >
                <option value="">Select a Bus</option>
                {buses.map(b => (
                  <option key={b._id} value={b._id}>
                    {b.plate} - {b.seats} seats ({b.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
                <label className="block text-yellow-400 text-sm font-semibold mb-2">Available Seats</label>
              <input
                type="number"
                value={routeAvailableSeats}
                onChange={e => setRouteAvailableSeats(e.target.value)}
                placeholder="Leave empty to use bus capacity"
                  className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                min="0"
              />
            </div>
            <div>
                <label className="block text-yellow-400 text-sm font-semibold mb-2">Bus Image (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleRouteBusImageChange}
                  className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              {routeBusImagePreview && (
                  <div className="mt-3">
                  <img
                    src={routeBusImagePreview}
                    alt="Bus preview"
                      className="w-48 h-32 object-cover rounded-lg border-2 border-yellow-400"
                  />
                </div>
              )}
            </div>
              <button type="submit" className="w-full bg-yellow-400 text-black px-6 py-3 rounded-lg font-bold hover:bg-yellow-500 transition-colors">
              {editingRoute ? 'Update' : 'Create'} Route
            </button>
          </form>
        )}

          <div className="space-y-4">
          {routes.map(r => (
              <div key={r._id} className="bg-black/30 rounded-lg p-6 border-2 border-gray-700 hover:border-yellow-400 transition-all">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                {r.busImage && (
                  <img
                      src={`${API_BASE_URL}${r.busImage}`}
                    alt={`${r.from} to ${r.to}`}
                      className="w-32 h-24 object-cover rounded-lg border-2 border-yellow-400"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-yellow-400 mb-2">{r.from} → {r.to}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Price</div>
                        <div className="text-yellow-400 font-semibold">ETB {r.price}</div>
                      </div>
                      {r.distance && (
                        <div>
                          <div className="text-gray-400">Distance</div>
                          <div className="text-white">{r.distance} km</div>
                        </div>
                      )}
                      {r.duration && (
                        <div>
                          <div className="text-gray-400">Duration</div>
                          <div className="text-white">{r.duration}</div>
                        </div>
                      )}
                    {r.availableSeats !== undefined && r.availableSeats !== null && (
                        <div>
                          <div className="text-gray-400">Available Seats</div>
                          <div className={`font-semibold ${r.availableSeats > 10 ? 'text-green-400' : r.availableSeats > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {r.availableSeats}
                          </div>
                        </div>
                    )}
                  </div>
                </div>
                  <div className="flex gap-2">
                    <button onClick={() => editRoute(r)} className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-colors">
                      Edit
                    </button>
                    <button onClick={() => deleteRoute(r._id)} className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors">
                      Delete
                    </button>
              </div>
              </div>
            </div>
          ))}
            {routes.length === 0 && (
              <div className="text-center py-12 bg-black/30 rounded-lg border-2 border-dashed border-yellow-400/50">
                <p className="text-gray-400 text-lg">No routes yet.</p>
        </div>
            )}
      </div>
        </div>
      )}

      {/* Buses Tab */}
      {activeTab === 'buses' && (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 border-2 border-yellow-400 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-yellow-400">Buses Management</h2>
            <button
              onClick={() => { resetBusForm(); setShowBusForm(!showBusForm); }}
              className="bg-yellow-400 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
            >
              {showBusForm ? 'Cancel' : '+ Add Bus'}
            </button>
          </div>

          {showBusForm && (
            <form onSubmit={handleBusSubmit} className="bg-black/30 rounded-lg p-6 mb-6 border border-yellow-400/30 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-yellow-400 text-sm font-semibold mb-2">Plate Number *</label>
                  <input
                    value={busPlate}
                    onChange={e => setBusPlate(e.target.value)}
                    placeholder="Plate Number"
                    className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-yellow-400 text-sm font-semibold mb-2">Number of Seats *</label>
                  <input
                    type="number"
                    value={busSeats}
                    onChange={e => setBusSeats(e.target.value)}
                    placeholder="Number of Seats"
                    className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-yellow-400 text-sm font-semibold mb-2">Bus Type *</label>
                <select
                  value={busType}
                  onChange={e => setBusType(e.target.value)}
                  className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="Standard">Standard</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>
              <div>
                <label className="block text-yellow-400 text-sm font-semibold mb-2">Bus Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBusImageChange}
                  className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                {busImagePreview && (
                  <div className="mt-3">
                    <img src={busImagePreview} alt="Preview" className="w-48 h-32 object-cover rounded-lg border-2 border-yellow-400" />
                  </div>
                )}
              </div>
              <button type="submit" className="w-full bg-yellow-400 text-black px-6 py-3 rounded-lg font-bold hover:bg-yellow-500 transition-colors">
                {editingBus ? 'Update' : 'Create'} Bus
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buses.map(b => (
              <div key={b._id} className="bg-black/30 rounded-lg p-6 border-2 border-gray-700 hover:border-yellow-400 transition-all">
                {b.image && (
                  <img
                    src={`${API_BASE_URL}${b.image}`}
                    alt={b.plate}
                    className="w-full h-32 object-cover rounded-lg mb-4 border border-yellow-400"
                  />
                )}
                <h3 className="text-xl font-bold text-yellow-400 mb-2">{b.plate}</h3>
                <div className="space-y-1 text-sm">
                  <div className="text-gray-400">Seats: <span className="text-yellow-400 font-semibold">{b.seats}</span></div>
                  <div className="text-gray-400">Type: <span className="text-yellow-400 font-semibold">{b.type}</span></div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => editBus(b)} className="flex-1 bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => deleteBus(b._id)} className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {buses.length === 0 && (
              <div className="col-span-full text-center py-12 bg-black/30 rounded-lg border-2 border-dashed border-yellow-400/50">
                <p className="text-gray-400 text-lg">No buses yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedules Tab */}
      {activeTab === 'schedules' && (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 border-2 border-yellow-400 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-yellow-400">Schedules Management</h2>
              <p className="text-gray-400 text-sm mt-1">Add schedules to your routes so customers can book tickets</p>
            </div>
            <button
              onClick={() => { resetScheduleForm(); setShowScheduleForm(!showScheduleForm); }}
              className="bg-yellow-400 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
            >
              {showScheduleForm ? 'Cancel' : '+ Add Schedule'}
            </button>
          </div>
          
          {routes.length === 0 && (
            <div className="bg-yellow-400/20 border-2 border-yellow-400 rounded-lg p-4 mb-6">
              <p className="text-yellow-400 font-semibold">⚠️ You need to create routes first before adding schedules</p>
              <p className="text-gray-300 text-sm mt-1">Go to the Routes tab to create a route</p>
            </div>
          )}
          
          {buses.length === 0 && (
            <div className="bg-yellow-400/20 border-2 border-yellow-400 rounded-lg p-4 mb-6">
              <p className="text-yellow-400 font-semibold">⚠️ You need to add buses first before creating schedules</p>
              <p className="text-gray-300 text-sm mt-1">Go to the Buses tab to add a bus</p>
            </div>
          )}

        {showScheduleForm && (
            <form onSubmit={handleScheduleSubmit} className="bg-black/30 rounded-lg p-6 mb-6 border border-yellow-400/30 space-y-4">
              <div>
                <label className="block text-yellow-400 text-sm font-semibold mb-2">Select Route *</label>
            <select
              value={scheduleRouteId}
              onChange={e => setScheduleRouteId(e.target.value)}
                  className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              required
            >
              <option value="">Select Route</option>
              {routes.map(r => (
                <option key={r._id} value={r._id}>{r.from} → {r.to}</option>
              ))}
            </select>
              </div>
              <div>
                <label className="block text-yellow-400 text-sm font-semibold mb-2">Select Bus *</label>
            <select
              value={scheduleBusId}
              onChange={e => setScheduleBusId(e.target.value)}
                  className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              required
            >
              <option value="">Select Bus</option>
              {buses.map(b => (
                <option key={b._id} value={b._id}>{b.plate} ({b.seats} seats)</option>
              ))}
            </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative departure-calendar-container">
                  <label className="block text-yellow-400 text-sm font-semibold mb-2">Departure *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDepartureCalendar(!showDepartureCalendar);
                      setShowArrivalCalendar(false);
                    }}
                    className="w-full text-left p-3 rounded-lg border-2 border-yellow-400 bg-black text-yellow-400 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                  >
                    {scheduleDepartureDate ? (
                      <div>
                        <div className="text-yellow-400 font-bold">{getDateDisplay(scheduleDepartureDate).day}</div>
                        <div className="text-white text-sm">{getDateDisplay(scheduleDepartureDate).date}</div>
                      </div>
                    ) : (
                      <div className="text-gray-400 flex items-center gap-2">
                        <span>📅</span>
                        <span>Select departure date</span>
                      </div>
                    )}
                  </button>
                  {showDepartureCalendar && (
                    <div className="absolute z-20 w-full mt-2 bg-black/95 rounded-xl p-3 border-2 border-yellow-400 shadow-2xl">
                      {/* Calendar Header */}
                      <div className="flex items-center justify-between mb-3">
                        <button
                          type="button"
                          onClick={() => navigateDepartureMonth('prev')}
                          className="text-yellow-400 hover:text-yellow-300 text-lg font-bold px-2 py-1 rounded hover:bg-yellow-400/20 transition-colors"
                        >
                          ‹
                        </button>
                        <h3 className="text-yellow-400 font-bold text-sm">
                          {new Date(departureCalendarYear, departureCalendarMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button
                          type="button"
                          onClick={() => navigateDepartureMonth('next')}
                          className="text-yellow-400 hover:text-yellow-300 text-lg font-bold px-2 py-1 rounded hover:bg-yellow-400/20 transition-colors"
                        >
                          ›
                        </button>
                      </div>
                      
                      {/* Calendar Days Header */}
                      <div className="grid grid-cols-7 gap-1 mb-1">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="text-center text-gray-400 text-xs font-semibold py-1">
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      {/* Calendar Days */}
                      <div className="grid grid-cols-7 gap-1">
                        {generateCalendarDays(departureCalendarYear, departureCalendarMonth).map((day, index) => {
                          if (day === null) {
                            return <div key={index} className="aspect-square"></div>;
                          }
                          const isPast = isDatePast(departureCalendarYear, departureCalendarMonth, day);
                          const isSelected = isDateSelected(departureCalendarYear, departureCalendarMonth, day, scheduleDepartureDate);
                          const isToday = (() => {
                            const today = new Date();
                            return today.getDate() === day && 
                                   today.getMonth() === departureCalendarMonth && 
                                   today.getFullYear() === departureCalendarYear;
                          })();
                          
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => !isPast && handleDepartureDateSelect(departureCalendarYear, departureCalendarMonth, day)}
                              disabled={isPast}
                              className={`aspect-square rounded-lg font-semibold text-xs transition-all ${
                                isSelected
                                  ? 'bg-yellow-400 text-black border-2 border-yellow-400'
                                  : isPast
                                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                  : isToday
                                  ? 'bg-yellow-400/30 text-yellow-400 border-2 border-yellow-400/50 hover:bg-yellow-400/50'
                                  : 'bg-black/30 text-white border border-gray-700 hover:bg-yellow-400/20 hover:border-yellow-400'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* Today Button */}
                      <div className="mt-3 flex justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            const today = new Date();
                            handleDepartureDateSelect(today.getFullYear(), today.getMonth(), today.getDate());
                          }}
                          className="text-yellow-400 text-xs hover:text-yellow-300 underline"
                        >
                          Select Today
                        </button>
                      </div>
                    </div>
                  )}
                  {/* Time Input */}
                  <input
                    type="time"
                    value={scheduleDepartureTime}
                    onChange={e => handleDepartureTimeChange(e.target.value)}
                    className="w-full mt-2 p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    required
                  />
              </div>
              <div className="relative arrival-calendar-container">
                  <label className="block text-yellow-400 text-sm font-semibold mb-2">Arrival *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowArrivalCalendar(!showArrivalCalendar);
                      setShowDepartureCalendar(false);
                    }}
                    className="w-full text-left p-3 rounded-lg border-2 border-yellow-400 bg-black text-yellow-400 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                  >
                    {scheduleArrivalDate ? (
                      <div>
                        <div className="text-yellow-400 font-bold">{getDateDisplay(scheduleArrivalDate).day}</div>
                        <div className="text-white text-sm">{getDateDisplay(scheduleArrivalDate).date}</div>
                      </div>
                    ) : (
                      <div className="text-gray-400 flex items-center gap-2">
                        <span>📅</span>
                        <span>Select arrival date</span>
                      </div>
                    )}
                  </button>
                  {showArrivalCalendar && (
                    <div className="absolute z-20 w-full mt-2 bg-black/95 rounded-xl p-3 border-2 border-yellow-400 shadow-2xl">
                      {/* Calendar Header */}
                      <div className="flex items-center justify-between mb-3">
                        <button
                          type="button"
                          onClick={() => navigateArrivalMonth('prev')}
                          className="text-yellow-400 hover:text-yellow-300 text-lg font-bold px-2 py-1 rounded hover:bg-yellow-400/20 transition-colors"
                        >
                          ‹
                        </button>
                        <h3 className="text-yellow-400 font-bold text-sm">
                          {new Date(arrivalCalendarYear, arrivalCalendarMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button
                          type="button"
                          onClick={() => navigateArrivalMonth('next')}
                          className="text-yellow-400 hover:text-yellow-300 text-lg font-bold px-2 py-1 rounded hover:bg-yellow-400/20 transition-colors"
                        >
                          ›
                        </button>
                      </div>
                      
                      {/* Calendar Days Header */}
                      <div className="grid grid-cols-7 gap-1 mb-1">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="text-center text-gray-400 text-xs font-semibold py-1">
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      {/* Calendar Days */}
                      <div className="grid grid-cols-7 gap-1">
                        {generateCalendarDays(arrivalCalendarYear, arrivalCalendarMonth).map((day, index) => {
                          if (day === null) {
                            return <div key={index} className="aspect-square"></div>;
                          }
                          const date = new Date(arrivalCalendarYear, arrivalCalendarMonth, day);
                          const depDate = scheduleDepartureDate ? new Date(scheduleDepartureDate) : null;
                          const isBeforeDeparture = depDate && date < depDate;
                          const isPast = isDatePast(arrivalCalendarYear, arrivalCalendarMonth, day);
                          const isSelected = isDateSelected(arrivalCalendarYear, arrivalCalendarMonth, day, scheduleArrivalDate);
                          const isToday = (() => {
                            const today = new Date();
                            return today.getDate() === day && 
                                   today.getMonth() === arrivalCalendarMonth && 
                                   today.getFullYear() === arrivalCalendarYear;
                          })();
                          
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => !isPast && !isBeforeDeparture && handleArrivalDateSelect(arrivalCalendarYear, arrivalCalendarMonth, day)}
                              disabled={isPast || isBeforeDeparture}
                              className={`aspect-square rounded-lg font-semibold text-xs transition-all ${
                                isSelected
                                  ? 'bg-yellow-400 text-black border-2 border-yellow-400'
                                  : isPast || isBeforeDeparture
                                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                  : isToday
                                  ? 'bg-yellow-400/30 text-yellow-400 border-2 border-yellow-400/50 hover:bg-yellow-400/50'
                                  : 'bg-black/30 text-white border border-gray-700 hover:bg-yellow-400/20 hover:border-yellow-400'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* Today Button */}
                      <div className="mt-3 flex justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            const today = new Date();
                            const minDate = scheduleDepartureDate ? new Date(scheduleDepartureDate) : today;
                            if (minDate >= today) {
                              handleArrivalDateSelect(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
                            }
                          }}
                          className="text-yellow-400 text-xs hover:text-yellow-300 underline"
                        >
                          Select Earliest Available
                        </button>
                      </div>
                    </div>
                  )}
                  {/* Time Input */}
                  <input
                    type="time"
                    value={scheduleArrivalTime}
                    onChange={e => handleArrivalTimeChange(e.target.value)}
                    className="w-full mt-2 p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    required
                  />
              </div>
            </div>
            <div>
                <label className="block text-yellow-400 text-sm font-semibold mb-2">Available Seats</label>
              <input
                type="number"
                value={scheduleSeatsLeft}
                onChange={e => setScheduleSeatsLeft(e.target.value)}
                placeholder="Leave empty to use bus capacity"
                  className="w-full p-3 border-2 border-yellow-400 rounded-lg bg-black text-yellow-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                min="0"
              />
                {scheduleBusId && (
                  <p className="text-gray-400 text-xs mt-1">
                    Bus capacity: {buses.find(b => b._id === scheduleBusId)?.seats || 'N/A'} seats
              </p>
                )}
            </div>
              <button type="submit" className="w-full bg-yellow-400 text-black px-6 py-3 rounded-lg font-bold hover:bg-yellow-500 transition-colors">
              {editingSchedule ? 'Update' : 'Create'} Schedule
            </button>
          </form>
        )}

          <div className="space-y-4">
          {schedules.map(s => (
              <div key={s._id} className="bg-black/30 rounded-lg p-6 border-2 border-gray-700 hover:border-yellow-400 transition-all">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-yellow-400 mb-2">{s.route?.from} → {s.route?.to}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Bus</div>
                        <div className="text-yellow-400 font-semibold">{s.bus?.plate}</div>
                  </div>
                      <div>
                        <div className="text-gray-400">Departure</div>
                        <div className="text-white">{formatDate(s.departure)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Arrival</div>
                        <div className="text-white">{formatDate(s.arrival)}</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-gray-400">Available Seats: </span>
                      <span className={`font-semibold ${s.seatsLeft !== undefined && s.seatsLeft !== null ? (s.seatsLeft > 10 ? 'text-green-400' : s.seatsLeft > 0 ? 'text-yellow-400' : 'text-red-400') : 'text-gray-400'}`}>
                      {s.seatsLeft !== undefined && s.seatsLeft !== null ? s.seatsLeft : s.bus?.seats || 'N/A'}
                    </span>
                    {s.bus?.seats && (
                        <span className="text-gray-400"> / {s.bus.seats} total</span>
                    )}
                  </div>
                </div>
                  <div className="flex gap-2">
                    <button onClick={() => editSchedule(s)} className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-colors">
                      Edit
                    </button>
                    <button onClick={() => deleteSchedule(s._id)} className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors">
                      Delete
                    </button>
                </div>
              </div>
            </div>
          ))}
            {schedules.length === 0 && (
              <div className="text-center py-12 bg-black/30 rounded-lg border-2 border-dashed border-yellow-400/50">
                <p className="text-gray-400 text-lg">No schedules yet.</p>
        </div>
            )}
      </div>
        </div>
      )}

      {/* Bookings Tab - NEW FEATURE 1 */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 border-2 border-yellow-400 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                <span>🎫</span> Company Bookings
              </h2>
              <div className="text-sm text-gray-400">
                Total: {companyBookings.length} | 
                Pending: {companyBookings.filter(b => {
                  const status = String(b.status || 'pending').toLowerCase().trim();
                  return status === 'pending';
                }).length} | 
                Confirmed: {companyBookings.filter(b => {
                  const status = String(b.status || '').toLowerCase().trim();
                  return status === 'confirmed' || status === 'completed';
                }).length}
              </div>
            </div>
            
            {/* Filters */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-yellow-400 text-sm font-semibold mb-2">Search</label>
                  <input
                    type="text"
                    value={bookingSearch}
                    onChange={e => setBookingSearch(e.target.value)}
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        handleBookingSearch();
                      }
                    }}
                    placeholder="Search by route, customer name, email..."
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
              </div>
              <div className="flex items-end gap-3">
                <button
                  onClick={handleBookingSearch}
                  className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-bold hover:bg-yellow-500 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search
                </button>
                {(activeBookingSearch || activeBookingStatusFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setBookingSearch('');
                      setBookingStatusFilter('all');
                      setActiveBookingSearch('');
                      setActiveBookingStatusFilter('all');
                    }}
                    className="bg-gray-700 text-yellow-400 px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear
                  </button>
                )}
              </div>
              {(activeBookingSearch || activeBookingStatusFilter !== 'all') && (
                <div className="bg-yellow-400/20 border border-yellow-400 rounded-lg p-3 text-sm">
                  <span className="text-yellow-400 font-semibold">Active Filters: </span>
                  {activeBookingSearch && (
                    <span className="text-white">Search: "{activeBookingSearch}"</span>
                  )}
                  {activeBookingSearch && activeBookingStatusFilter !== 'all' && <span className="text-gray-400"> | </span>}
                  {activeBookingStatusFilter !== 'all' && (
                    <span className="text-white">Status: {activeBookingStatusFilter.charAt(0).toUpperCase() + activeBookingStatusFilter.slice(1)}</span>
                  )}
                </div>
              )}
            </div>

            {/* Bookings List */}
            <div className="space-y-4">
              {filteredBookings.length === 0 ? (
                <div className="text-center py-12 bg-black/30 rounded-lg border-2 border-dashed border-yellow-400/50">
                  <p className="text-gray-400 text-lg mb-2">No bookings found</p>
                  {(activeBookingSearch || activeBookingStatusFilter !== 'all') && (
                    <p className="text-gray-500 text-sm mb-4">
                      Try adjusting your filters or{' '}
                      <button
                        onClick={() => {
                          setBookingSearch('');
                          setBookingStatusFilter('all');
                          setActiveBookingSearch('');
                          setActiveBookingStatusFilter('all');
                        }}
                        className="text-yellow-400 hover:text-yellow-300 underline"
                      >
                        clear all filters
                      </button>
                    </p>
                  )}
                  {activeBookingStatusFilter === 'pending' && (
                    <div className="mt-4 text-xs text-gray-500 space-y-1 bg-black/50 p-3 rounded">
                      <p>Debug Info:</p>
                      <p>Total bookings: {companyBookings.length}</p>
                      <p>Pending bookings found: {companyBookings.filter(b => {
                        const status = String(b.status || 'pending').toLowerCase().trim();
                        return status === 'pending';
                      }).length}</p>
                      <p>Active status filter: "{activeBookingStatusFilter}"</p>
                    </div>
                  )}
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
                            <div className="space-y-1">
                              <p className="text-gray-400 text-sm">
                                <span className="text-yellow-400 font-semibold">Customer:</span> {booking.user?.name || booking.user?.email || 'N/A'}
                              </p>
                              {booking.user?.email && (
                                <p className="text-gray-400 text-sm">
                                  <span className="text-yellow-400 font-semibold">Email:</span> {booking.user.email}
                                </p>
                              )}
                              {booking.user?.phoneNumber && (
                                <p className="text-gray-400 text-sm">
                                  <span className="text-yellow-400 font-semibold">Phone:</span> {booking.user.phoneNumber}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(booking.status)}`}>
                            {booking.status || 'Pending'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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
                        
                        {/* Passenger Information */}
                        {booking.passengers && booking.passengers.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-700">
                            <h4 className="text-yellow-400 font-semibold mb-3 flex items-center gap-2">
                              <span>👥</span> Passenger Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {booking.passengers.map((passenger, idx) => (
                                <div key={idx} className="bg-black/50 rounded-lg p-4 border border-yellow-400/30">
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-400 text-xs">Seat {passenger.seat || booking.seats?.[idx] || 'N/A'}</span>
                                    </div>
                                    <div className="text-white font-semibold">
                                      {passenger.name || `${passenger.firstName || ''} ${passenger.middleName || ''} ${passenger.lastName || ''}`.trim() || 'N/A'}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      {passenger.phoneNumber && (
                                        <div>
                                          <span className="text-gray-400">Phone:</span>
                                          <span className="text-white ml-1">{passenger.phoneNumber}</span>
                                        </div>
                                      )}
                                      {passenger.email && (
                                        <div>
                                          <span className="text-gray-400">Email:</span>
                                          <span className="text-white ml-1">{passenger.email}</span>
                                        </div>
                                      )}
                                      {passenger.dateOfBirth && (
                                        <div>
                                          <span className="text-gray-400">DOB:</span>
                                          <span className="text-white ml-1">{new Date(passenger.dateOfBirth).toLocaleDateString()}</span>
                                        </div>
                                      )}
                                      {passenger.age && (
                                        <div>
                                          <span className="text-gray-400">Age:</span>
                                          <span className="text-white ml-1">{passenger.age} years</span>
                                        </div>
                                      )}
                                      {passenger.gender && (
                                        <div>
                                          <span className="text-gray-400">Gender:</span>
                                          <span className="text-white ml-1 capitalize">{passenger.gender}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          {/* Pending Customers Section */}
          {pendingCustomers.length > 0 && (
            <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/30 rounded-xl p-8 border-2 border-yellow-400 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                  <span>⏳</span> Pending Customers ({pendingCustomers.length})
                </h2>
                <span className="bg-yellow-400/20 text-yellow-400 px-4 py-1 rounded-full text-sm font-semibold border border-yellow-400 animate-pulse">
                  Action Required
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingCustomers.map((customer, idx) => {
                  const pendingBookings = customer.bookings.filter(b => b.status?.toLowerCase() === 'pending');
                  return (
                    <div key={idx} className="bg-black/50 rounded-lg p-6 border-2 border-yellow-400/50 hover:border-yellow-400 transition-all">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-lg font-bold text-yellow-400">
                            {customer.user?.firstName ? `${customer.user.firstName} ${customer.user.lastName || ''}`.trim() : customer.user?.name || customer.user?.email || 'Unknown'}
                          </h3>
                          <p className="text-gray-400 text-sm">{customer.user?.email}</p>
                          {customer.user?.phoneNumber && (
                            <p className="text-gray-400 text-sm">📞 {customer.user.phoneNumber}</p>
                          )}
                        </div>
                        <div className="pt-3 border-t border-gray-700">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400 text-sm">Pending Bookings:</span>
                            <span className="text-yellow-400 font-bold">{pendingBookings.length}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Total Amount:</span>
                            <span className="text-yellow-400 font-bold">
                              ETB {pendingBookings.reduce((sum, b) => sum + (b.total || 0), 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="pt-2">
                          {pendingBookings.map((booking, bidx) => (
                            <div key={bidx} className="text-xs text-gray-400 mb-1">
                              • {booking.route?.from} → {booking.route?.to} - ETB {booking.total || 0}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Customers Section */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 border-2 border-yellow-400 shadow-lg">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center gap-2">
              <span>👥</span> All Customers ({allCustomers.length})
            </h2>
            
            {allCustomers.length === 0 ? (
              <div className="text-center py-12 bg-black/30 rounded-lg border-2 border-dashed border-yellow-400/50">
                <p className="text-gray-400 text-lg">No customers found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allCustomers.map((customer, idx) => {
                  const confirmedBookings = customer.bookings.filter(b => 
                    b.status?.toLowerCase() === 'confirmed' || b.status?.toLowerCase() === 'completed'
                  );
                  const pendingBookings = customer.bookings.filter(b => 
                    b.status?.toLowerCase() === 'pending'
                  );
                  const cancelledBookings = customer.bookings.filter(b => 
                    b.status?.toLowerCase() === 'cancelled'
                  );
                  
                  return (
                    <div key={idx} className="bg-black/30 rounded-lg p-6 border-2 border-gray-700 hover:border-yellow-400 transition-all">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-yellow-400 mb-2">
                                {customer.user?.firstName ? `${customer.user.firstName} ${customer.user.middleName || ''} ${customer.user.lastName || ''}`.trim() : customer.user?.name || customer.user?.email || 'Unknown Customer'}
                              </h3>
                              <div className="space-y-1">
                                <p className="text-gray-400 text-sm">
                                  <span className="text-yellow-400 font-semibold">Email:</span> {customer.user?.email || 'N/A'}
                                </p>
                                {customer.user?.phoneNumber && (
                                  <p className="text-gray-400 text-sm">
                                    <span className="text-yellow-400 font-semibold">Phone:</span> {customer.user.phoneNumber}
                                  </p>
                                )}
                                {customer.user?.dateOfBirth && (
                                  <p className="text-gray-400 text-sm">
                                    <span className="text-yellow-400 font-semibold">Date of Birth:</span> {new Date(customer.user.dateOfBirth).toLocaleDateString()}
                                  </p>
                                )}
                                {customer.user?.gender && (
                                  <p className="text-gray-400 text-sm">
                                    <span className="text-yellow-400 font-semibold">Gender:</span> {customer.user.gender.charAt(0).toUpperCase() + customer.user.gender.slice(1)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 items-end">
                              <span className="bg-yellow-400/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-semibold border border-yellow-400">
                                {customer.totalBookings} {customer.totalBookings === 1 ? 'Booking' : 'Bookings'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="bg-black/30 rounded-lg p-3">
                              <div className="text-gray-400 text-xs mb-1">Total Spent</div>
                              <div className="text-yellow-400 font-semibold">ETB {customer.totalSpent.toLocaleString()}</div>
                            </div>
                            <div className="bg-green-500/20 rounded-lg p-3 border border-green-500/30">
                              <div className="text-gray-400 text-xs mb-1">Confirmed</div>
                              <div className="text-green-400 font-semibold">{confirmedBookings.length}</div>
                            </div>
                            <div className="bg-yellow-500/20 rounded-lg p-3 border border-yellow-500/30">
                              <div className="text-gray-400 text-xs mb-1">Pending</div>
                              <div className="text-yellow-400 font-semibold">{pendingBookings.length}</div>
                            </div>
                            <div className="bg-red-500/20 rounded-lg p-3 border border-red-500/30">
                              <div className="text-gray-400 text-xs mb-1">Cancelled</div>
                              <div className="text-red-400 font-semibold">{cancelledBookings.length}</div>
                            </div>
                          </div>
                          
                          {/* Customer Bookings */}
                          <div className="mt-4 pt-4 border-t border-gray-700">
                            <h4 className="text-yellow-400 font-semibold mb-3">Customer Bookings</h4>
                            <div className="space-y-2">
                              {customer.bookings.map((booking, bidx) => (
                                <div key={bidx} className="bg-black/50 rounded-lg p-3 border border-gray-700">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="text-white font-semibold">
                                        {booking.route?.from} → {booking.route?.to}
                                      </div>
                                      <div className="text-gray-400 text-xs mt-1">
                                        Seats: {booking.seats?.join(', ') || 'N/A'} | 
                                        Amount: ETB {booking.total || 0} | 
                                        {formatDate(booking.createdAt)}
                                      </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(booking.status)}`}>
                                      {booking.status || 'Pending'}
                                    </span>
                                  </div>
                                  {/* Show passengers for this booking */}
                                  {booking.passengers && booking.passengers.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-gray-700">
                                      <div className="text-gray-400 text-xs mb-1">Passengers:</div>
                                      <div className="flex flex-wrap gap-2">
                                        {booking.passengers.map((passenger, pidx) => (
                                          <span key={pidx} className="text-xs bg-black/50 px-2 py-1 rounded border border-gray-600">
                                            Seat {passenger.seat || booking.seats?.[pidx]}: {passenger.name || `${passenger.firstName || ''} ${passenger.lastName || ''}`.trim()}
                                            {passenger.age && ` (${passenger.age} yrs)`}
                                            {passenger.gender && ` - ${passenger.gender.charAt(0).toUpperCase()}`}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics Tab - NEW FEATURE 2 */}
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
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 border-2 border-yellow-400 shadow-lg">
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
                <div className="text-center text-gray-400 py-8">No booking data available</div>
              )}
            </div>
          </div>

          {/* Booking Status Distribution */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 border-2 border-yellow-400 shadow-lg">
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
                    style={{ width: `${companyBookings.length > 0 ? (confirmedBookings / companyBookings.length) * 100 : 0}%` }}
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
                    style={{ width: `${companyBookings.length > 0 ? (pendingBookings / companyBookings.length) * 100 : 0}%` }}
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
                    style={{ width: `${companyBookings.length > 0 ? (cancelledBookings / companyBookings.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
