import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function RouteDetails() {
  const { routeId } = useParams();
  const [searchParams] = useSearchParams();
  const scheduleId = searchParams.get('scheduleId');
  const navigate = useNavigate();
  
  const [route, setRoute] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeat, setSelectedSeat] = useState(null); // Single seat selection
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processing, setProcessing] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [booking, setBooking] = useState(null);
  const [paymentCode, setPaymentCode] = useState(null);
  const [bookingType, setBookingType] = useState(null); // 'profile' or 'other'
  const [passengerInfo, setPassengerInfo] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    age: ''
  });
  const [user, setUser] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false); // Show booking form after date selection
  const [rating, setRating] = useState(null);
  const [ratingData, setRatingData] = useState({ average: 0, count: 0 });
  const [userRating, setUserRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [tripType, setTripType] = useState('one-way'); // 'one-way' or 'round-trip'
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showReturnDatePicker, setShowReturnDatePicker] = useState(false);
  const [showSeatSelector, setShowSeatSelector] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [returnCalendarMonth, setReturnCalendarMonth] = useState(new Date().getMonth());
  const [returnCalendarYear, setReturnCalendarYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadRouteDetails();
    loadRatings();
    loadUser();
  }, [routeId, scheduleId]);

  function loadUser() {
    const userStr = localStorage.getItem('kelale_user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }

  async function loadRatings() {
    try {
      const res = await api.get(`/api/ratings/route/${routeId}`);
      setRatingData(res.data);
      
      // Check if user has already rated
      const token = localStorage.getItem('kelale_token');
      if (token) {
        try {
          const userRatingRes = await api.get(`/api/ratings/user/route/${routeId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (userRatingRes.data) {
            setUserRating(userRatingRes.data.rating);
            setRatingComment(userRatingRes.data.comment || '');
          }
        } catch (e) {
          // User hasn't rated yet
        }
      }
    } catch (e) {
      console.error('Error loading ratings:', e);
    }
  }

  async function submitRating(ratingValue) {
    const token = localStorage.getItem('kelale_token');
    if (!token) {
      alert('Please login to rate this route');
      return;
    }

    setSubmittingRating(true);
    try {
      await api.post('/api/ratings', {
        routeId: route._id,
        rating: ratingValue,
        comment: ratingComment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserRating(ratingValue);
      loadRatings(); // Reload ratings
      alert('Rating submitted successfully!');
    } catch (e) {
      alert('Error submitting rating: ' + (e?.response?.data?.error || e.message));
    } finally {
      setSubmittingRating(false);
    }
  }

  async function loadRouteDetails() {
    try {
      setLoading(true);
      const res = await api.get(`/api/routes?from=&to=`);
      const foundRoute = res.data.find(r => r._id === routeId);
      
      if (foundRoute) {
        setRoute(foundRoute);
        if (foundRoute.schedules && foundRoute.schedules.length > 0) {
          if (scheduleId) {
            // If scheduleId is provided, find that specific schedule
            const foundSchedule = foundRoute.schedules.find(s => s._id === scheduleId);
            setSchedule(foundSchedule || foundRoute.schedules[0]); // Fallback to first schedule if not found
          } else {
            // If no scheduleId, use the first available schedule
            setSchedule(foundRoute.schedules[0]);
          }
        }
      }
    } catch (e) {
      console.error(e);
      alert('Error loading route details');
    } finally {
      setLoading(false);
    }
  }

  function toggleSeat(seatNumber) {
    if (selectedSeat === seatNumber) {
      setSelectedSeat(null);
    } else {
      setSelectedSeat(seatNumber);
    }
  }

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

  function handleDateOfBirthChange(dateOfBirth) {
    const age = calculateAge(dateOfBirth);
    setPassengerInfo({...passengerInfo, dateOfBirth, age});
  }

  function handleBookingTypeSelect(type) {
    setBookingType(type);
    if (type === 'profile' && user) {
      // Auto-fill from user profile
      const userDateOfBirth = user.dateOfBirth || '';
      const userAge = calculateAge(userDateOfBirth);
      setPassengerInfo({
        firstName: user.firstName || '',
        middleName: user.middleName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
        dateOfBirth: userDateOfBirth,
        gender: user.gender || '',
        age: userAge
      });
    } else {
      // Clear form for booking for another person
      setPassengerInfo({
        firstName: '',
        middleName: '',
        lastName: '',
        phoneNumber: '',
        dateOfBirth: '',
        gender: '',
        age: ''
      });
    }
  }

  function validatePassengerInfo() {
    if (bookingType === 'profile' && user) {
      // Profile booking - check user data
      if (!user.firstName || !user.lastName) {
        alert('Your profile is missing required information. Please update your profile or book for another person.');
        return false;
      }
      return true;
    } else {
      // Booking for another person - check form data
      if (!passengerInfo.firstName || !passengerInfo.firstName.trim()) {
        alert('Please enter first name');
        return false;
      }
      if (!passengerInfo.lastName || !passengerInfo.lastName.trim()) {
        alert('Please enter last name');
        return false;
      }
      if (!passengerInfo.dateOfBirth) {
        alert('Please enter date of birth');
        return false;
      }
      if (!passengerInfo.gender) {
        alert('Please select gender');
        return false;
      }
      return true;
    }
  }

  async function handleBooking() {
    console.log('handleBooking called', { bookingType, selectedSeat, passengerInfo, user });
    
    const token = localStorage.getItem('kelale_token');
    if (!token) {
      alert('Please login to make a booking');
      navigate('/login');
      return;
    }

    if (!selectedSeat) {
      alert('Please select a seat');
      return;
    }

    if (!schedule) {
      alert('Schedule not found');
      return;
    }

    if (!validatePassengerInfo()) {
      console.log('Validation failed');
      return;
    }

    setProcessing(true);
    try {
      console.log('Starting booking process...');
      let passengerData;
      
      if (bookingType === 'profile' && user) {
        // Use profile data
        const nameParts = [user.firstName || ''];
        if (user.middleName) nameParts.push(user.middleName);
        nameParts.push(user.lastName || '');
        const fullName = nameParts.filter(p => p).join(' ');
        
        const userDateOfBirth = user.dateOfBirth || '';
        const userAge = calculateAge(userDateOfBirth);
        passengerData = {
          seat: selectedSeat,
          firstName: user.firstName || '',
          middleName: user.middleName || '',
          lastName: user.lastName || '',
          name: fullName,
          phone: user.phoneNumber || '',
          phoneNumber: user.phoneNumber || '',
          email: user.email || '',
          dateOfBirth: userDateOfBirth,
          gender: user.gender || '',
          age: userAge
        };
      } else {
        // Use form data
        const nameParts = [passengerInfo.firstName.trim()];
        if (passengerInfo.middleName && passengerInfo.middleName.trim()) {
          nameParts.push(passengerInfo.middleName.trim());
        }
        nameParts.push(passengerInfo.lastName.trim());
        const fullName = nameParts.join(' ');

        passengerData = {
          seat: selectedSeat,
          firstName: passengerInfo.firstName.trim(),
          middleName: passengerInfo.middleName?.trim() || '',
          lastName: passengerInfo.lastName.trim(),
          name: fullName,
          phone: passengerInfo.phoneNumber?.trim() || '',
          phoneNumber: passengerInfo.phoneNumber?.trim() || '',
          dateOfBirth: passengerInfo.dateOfBirth || '',
          gender: passengerInfo.gender || '',
          age: passengerInfo.age || ''
        };
      }

      const bookingData = {
        routeId: route._id,
        busId: schedule.bus._id,
        scheduleId: schedule._id,
        seats: [selectedSeat],
        paymentMethod,
        passengers: [passengerData]
      };

      console.log('Sending booking data:', bookingData);
      const res = await api.post('/api/bookings', bookingData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Booking successful:', res.data);
      setBooking(res.data.booking);
      setQrCode(res.data.qr);
      setPaymentCode(res.data.paymentCode || res.data.booking?.paymentCode);
      setBookingComplete(true);
    } catch (e) {
      console.error('Booking error:', e);
      console.error('Error response:', e?.response?.data);
      alert('Booking failed: ' + (e?.response?.data?.msg || e.message || 'Unknown error'));
    } finally {
      setProcessing(false);
    }
  }


  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatDateOnly(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function getTodayDate() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().slice(0, 10);
  }

  function getDateDisplay(dateString) {
    if (!dateString) return 'Select date';
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      day: days[date.getDay()],
      date: `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
    };
  }

  function generateSeatNumbers(totalSeats) {
    return Array.from({ length: totalSeats }, (_, i) => i + 1);
  }

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

  function handleDateSelect(year, month, day, isReturn = false) {
    const date = new Date(year, month, day);
    const dateString = date.toISOString().slice(0, 10);
    
    if (isReturn) {
      setReturnDate(dateString);
      setShowReturnDatePicker(false);
    } else {
      setDepartureDate(dateString);
      setShowDatePicker(false);
      // Update return calendar to start from departure date
      if (dateString) {
        const depDate = new Date(dateString);
        setReturnCalendarMonth(depDate.getMonth());
        setReturnCalendarYear(depDate.getFullYear());
      }
    }
  }

  function handleContinueToBooking() {
    if (!departureDate) {
      alert('Please select a departure date first');
      return;
    }
    setShowBookingForm(true);
  }

  function navigateMonth(direction, isReturn = false) {
    if (isReturn) {
      if (direction === 'prev') {
        if (returnCalendarMonth === 0) {
          setReturnCalendarMonth(11);
          setReturnCalendarYear(returnCalendarYear - 1);
        } else {
          setReturnCalendarMonth(returnCalendarMonth - 1);
        }
      } else {
        if (returnCalendarMonth === 11) {
          setReturnCalendarMonth(0);
          setReturnCalendarYear(returnCalendarYear + 1);
        } else {
          setReturnCalendarMonth(returnCalendarMonth + 1);
        }
      }
    } else {
      if (direction === 'prev') {
        if (calendarMonth === 0) {
          setCalendarMonth(11);
          setCalendarYear(calendarYear - 1);
        } else {
          setCalendarMonth(calendarMonth - 1);
        }
      } else {
        if (calendarMonth === 11) {
          setCalendarMonth(0);
          setCalendarYear(calendarYear + 1);
        } else {
          setCalendarMonth(calendarMonth + 1);
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center text-yellow-400">Loading route details...</div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center text-red-400">Route not found</div>
      </div>
    );
  }

  const totalSeats = schedule?.bus?.seats || route?.bus?.seats || 50;
  const availableSeats = schedule?.seatsLeft !== undefined && schedule.seatsLeft !== null 
    ? schedule.seatsLeft 
    : route?.availableSeats !== undefined && route.availableSeats !== null 
    ? route.availableSeats 
    : totalSeats;
  const seatNumbers = generateSeatNumbers(totalSeats);
  const totalPrice = route.price * (selectedSeat ? 1 : 0);
  
  // Get passenger full name
  const getPassengerFullName = () => {
    if (bookingType === 'profile' && user) {
      const parts = [user.firstName || ''];
      if (user.middleName) parts.push(user.middleName);
      parts.push(user.lastName || '');
      return parts.filter(p => p).join(' ');
    } else {
      const parts = [passengerInfo.firstName];
      if (passengerInfo.middleName) parts.push(passengerInfo.middleName);
      parts.push(passengerInfo.lastName);
      return parts.filter(p => p).join(' ');
    }
  };

  // Calculate if submit button should be disabled
  const isOtherBookingValid = bookingType === 'other' && 
    passengerInfo.firstName?.trim() && 
    passengerInfo.lastName?.trim() && 
    passengerInfo.dateOfBirth && 
    passengerInfo.gender;
  
  const isProfileBookingValid = bookingType === 'profile' && 
    user && 
    user.firstName && 
    user.lastName;
  
  const isFormValid = isOtherBookingValid || isProfileBookingValid;
  // Only disable if processing or missing critical info (seat, booking type, or form not shown)
  const isSubmitButtonDisabled = processing || !selectedSeat || !showBookingForm || bookingComplete || !bookingType;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-yellow-400 hover:text-yellow-500 mb-4 flex items-center gap-2"
        >
          ← Back to Search
        </button>
        <h1 className="text-3xl font-bold text-yellow-400 mb-2">Route Details</h1>
      </div>

      {bookingComplete ? (
        /* Booking Summary Page */
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl p-8 border-2 border-yellow-400">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">Booking Summary</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Booking Information */}
            <div className="bg-black/30 rounded-lg p-6 border border-yellow-400/30">
              <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                <span>📋</span> Booking Details
              </h3>
              <div className="space-y-3">
                <div className="bg-black/30 rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">Passenger Name</div>
                  <div className="text-white font-semibold text-lg">{getPassengerFullName()}</div>
                </div>
                <div className="bg-black/30 rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">Route</div>
                  <div className="text-white font-semibold text-lg">{route.from} → {route.to}</div>
                </div>
                {schedule && (
                  <>
                    <div className="bg-black/30 rounded-lg p-3">
                      <div className="text-gray-400 text-xs mb-1">Departure</div>
                      <div className="text-yellow-400 font-semibold">{formatDate(schedule.departure)}</div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3">
                      <div className="text-gray-400 text-xs mb-1">Arrival</div>
                      <div className="text-yellow-400 font-semibold">{formatDate(schedule.arrival)}</div>
                    </div>
                  </>
                )}
                <div className="bg-black/30 rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">Seat Number</div>
                  <div className="text-white font-semibold text-xl">{selectedSeat}</div>
                </div>
                <div className="bg-black/30 rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">Total Amount</div>
                  <div className="text-yellow-400 font-bold text-2xl">ETB {totalPrice}</div>
                </div>
                <div className="bg-yellow-500/20 rounded-lg p-3 border border-yellow-500/50">
                  <div className="text-yellow-400 text-xs mb-1">Status</div>
                  <div className="text-yellow-400 font-semibold">⏳ Pending Payment</div>
                  <div className="text-gray-400 text-xs mt-1">Complete payment to confirm your booking</div>
                </div>
              </div>
            </div>

            {/* Payment Code & QR Code */}
            <div className="space-y-6">
              {/* Payment Code */}
              {paymentCode && (
                <div className="bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 rounded-xl p-6 border-2 border-yellow-400">
                  <div className="text-center">
                    <div className="text-yellow-400 text-lg font-semibold mb-3 flex items-center justify-center gap-2">
                      <span>💳</span>
                      <span>Payment Code</span>
                    </div>
                    <div className="bg-black/50 rounded-xl p-4 mb-4 border-2 border-yellow-400">
                      <div className="text-4xl font-bold text-yellow-400 mb-2 font-mono tracking-wider">
                        {paymentCode}
                      </div>
                      <div className="text-gray-300 text-xs space-y-1">
                        <p>📱 Use this code for mobile payment</p>
                        <p>🏪 Or present at the station counter</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(paymentCode);
                        alert('Payment code copied to clipboard!');
                      }}
                      className="bg-yellow-400 text-black px-6 py-2 rounded-lg font-bold hover:bg-yellow-500 transition-colors text-sm"
                    >
                      📋 Copy Payment Code
                    </button>
                  </div>
                </div>
              )}

              {/* QR Code */}
              {qrCode && (
                <div className="bg-black/30 rounded-lg p-6 text-center border border-yellow-400/30">
                  <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center justify-center gap-2">
                    <span>🎫</span> QR Code
                  </h3>
                  <div className="bg-white p-4 rounded-lg inline-block mb-4">
                    <img src={qrCode} alt="QR Code" className="w-48 h-48 mx-auto" />
                  </div>
                  <p className="text-gray-400 text-sm mb-2">Show this QR code at the boarding point</p>
                  <p className="text-yellow-400 text-xs font-semibold">⚠️ Payment must be completed before boarding</p>
                </div>
              )}
            </div>
          </div>

          {/* Company Logo */}
          {route.company?.logo && (
            <div className="text-center mt-6">
              <p className="text-gray-400 text-sm mb-2">Powered by</p>
              <div className="inline-block bg-white p-3 rounded-lg">
                <img
                  src={`${API_BASE_URL}${route.company.logo}`}
                  alt={route.company.name}
                  className="h-16 object-contain"
                />
              </div>
              <p className="text-white font-semibold mt-2">{route.company.name}</p>
            </div>
          )}

          <div className="text-center mt-6">
            <button
              onClick={() => navigate('/')}
              className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-bold hover:bg-yellow-500 transition-all"
            >
              Book Another Trip
            </button>
          </div>
        </div>
      ) : (
        /* Booking Form View */
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Info Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trip Type Toggle */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl p-4 border-2 border-gray-700">
              <div className="flex gap-4">
                <button
                  onClick={() => setTripType('one-way')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    tripType === 'one-way'
                      ? 'bg-yellow-400 text-black'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  One Way
                </button>
                <button
                  onClick={() => setTripType('round-trip')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    tripType === 'round-trip'
                      ? 'bg-yellow-400 text-black'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Round Trip
                </button>
              </div>
            </div>

            {/* Date Picker Card */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl p-6 border-2 border-gray-700">
              <div className="mb-4">
                <label className="block text-yellow-400 text-sm font-semibold mb-2">Departure date</label>
                <button
                  onClick={() => {
                    setShowDatePicker(!showDatePicker);
                    setShowReturnDatePicker(false);
                  }}
                  className="w-full text-left p-4 bg-black/30 rounded-lg border-2 border-gray-700 hover:border-yellow-400 transition-all"
                >
                  {departureDate ? (
                    <div>
                      <div className="text-yellow-400 font-bold text-lg">{getDateDisplay(departureDate).day}</div>
                      <div className="text-white text-sm">{getDateDisplay(departureDate).date}</div>
                    </div>
                  ) : (
                    <div className="text-gray-400 flex items-center gap-2">
                      <span>📅</span>
                      <span>Select departure date</span>
                    </div>
                  )}
                </button>
                {showDatePicker && (
                  <div className="mt-4 bg-black/50 rounded-xl p-3 border-2 border-yellow-400 max-w-xs mx-auto">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={() => navigateMonth('prev', false)}
                        className="text-yellow-400 hover:text-yellow-300 text-lg font-bold px-2 py-1 rounded hover:bg-yellow-400/20 transition-colors"
                      >
                        ‹
                      </button>
                      <h3 className="text-yellow-400 font-bold text-sm">
                        {new Date(calendarYear, calendarMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </h3>
                      <button
                        onClick={() => navigateMonth('next', false)}
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
                      {generateCalendarDays(calendarYear, calendarMonth).map((day, index) => {
                        if (day === null) {
                          return <div key={index} className="aspect-square"></div>;
                        }
                        const isPast = isDatePast(calendarYear, calendarMonth, day);
                        const isSelected = isDateSelected(calendarYear, calendarMonth, day, departureDate);
                        const isToday = (() => {
                          const today = new Date();
                          return today.getDate() === day && 
                                 today.getMonth() === calendarMonth && 
                                 today.getFullYear() === calendarYear;
                        })();
                        
                        return (
                          <button
                            key={index}
                            onClick={() => !isPast && handleDateSelect(calendarYear, calendarMonth, day, false)}
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
                        onClick={() => {
                          const today = new Date();
                          handleDateSelect(today.getFullYear(), today.getMonth(), today.getDate(), false);
                        }}
                        className="text-yellow-400 text-xs hover:text-yellow-300 underline"
                      >
                        Select Today
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {tripType === 'round-trip' && (
                <div>
                  <label className="block text-yellow-400 text-sm font-semibold mb-2">Return date</label>
                  <button
                    onClick={() => {
                      setShowReturnDatePicker(!showReturnDatePicker);
                      setShowDatePicker(false);
                    }}
                    className="w-full text-left p-4 bg-black/30 rounded-lg border-2 border-gray-700 hover:border-yellow-400 transition-all"
                  >
                    {returnDate ? (
                      <div>
                        <div className="text-yellow-400 font-bold text-lg">{getDateDisplay(returnDate).day}</div>
                        <div className="text-white text-sm">{getDateDisplay(returnDate).date}</div>
                      </div>
                    ) : (
                      <div className="text-gray-400 flex items-center gap-2">
                        <span>📅</span>
                        <span>Select return date</span>
                      </div>
                    )}
                  </button>
                  {showReturnDatePicker && (
                    <div className="mt-4 bg-black/50 rounded-xl p-3 border-2 border-yellow-400 max-w-xs mx-auto">
                      {/* Calendar Header */}
                      <div className="flex items-center justify-between mb-3">
                        <button
                          onClick={() => navigateMonth('prev', true)}
                          className="text-yellow-400 hover:text-yellow-300 text-lg font-bold px-2 py-1 rounded hover:bg-yellow-400/20 transition-colors"
                        >
                          ‹
                        </button>
                        <h3 className="text-yellow-400 font-bold text-sm">
                          {new Date(returnCalendarYear, returnCalendarMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button
                          onClick={() => navigateMonth('next', true)}
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
                        {generateCalendarDays(returnCalendarYear, returnCalendarMonth).map((day, index) => {
                          if (day === null) {
                            return <div key={index} className="aspect-square"></div>;
                          }
                          const date = new Date(returnCalendarYear, returnCalendarMonth, day);
                          const depDate = departureDate ? new Date(departureDate) : null;
                          const isBeforeDeparture = depDate && date < depDate;
                          const isPast = isDatePast(returnCalendarYear, returnCalendarMonth, day);
                          const isSelected = isDateSelected(returnCalendarYear, returnCalendarMonth, day, returnDate);
                          const isToday = (() => {
                            const today = new Date();
                            return today.getDate() === day && 
                                   today.getMonth() === returnCalendarMonth && 
                                   today.getFullYear() === returnCalendarYear;
                          })();
                          
                          return (
                            <button
                              key={index}
                              onClick={() => !isPast && !isBeforeDeparture && handleDateSelect(returnCalendarYear, returnCalendarMonth, day, true)}
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
                          onClick={() => {
                            const today = new Date();
                            const minDate = departureDate ? new Date(departureDate) : today;
                            if (minDate >= today) {
                              handleDateSelect(minDate.getFullYear(), minDate.getMonth(), minDate.getDate(), true);
                            }
                          }}
                          className="text-yellow-400 text-xs hover:text-yellow-300 underline"
                        >
                          Select Earliest Available
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Continue Button - Show after date selection */}
              {departureDate && !showBookingForm && (
                <div className="mt-4">
                  <button
                    onClick={handleContinueToBooking}
                    className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-6 py-4 rounded-lg font-bold hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-lg"
                  >
                    Continue to Booking →
                  </button>
                </div>
              )}
            </div>

            {/* Booking Form Section - Show after clicking Continue */}
            {showBookingForm && !bookingComplete && (
              <div className="space-y-6">
                {/* Booking Type Selection */}
                {!bookingType && (
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl p-6 border-2 border-gray-700">
                    <h3 className="text-xl font-bold text-yellow-400 mb-4">Choose Booking Option</h3>
                    {!schedule ? (
                      <div className="text-center py-4">
                        <p className="text-yellow-400 mb-2">No schedules available for this route</p>
                        <p className="text-gray-400 text-sm">Please check back later or contact the company</p>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-4">
                        <button
                          onClick={() => handleBookingTypeSelect('profile')}
                          className="bg-black/30 rounded-lg p-6 border-2 border-gray-700 hover:border-yellow-400 transition-all text-left"
                        >
                          <div className="text-4xl mb-3">👤</div>
                          <h4 className="text-yellow-400 font-bold text-lg mb-2">Use My Profile</h4>
                          <p className="text-gray-400 text-sm">Auto-fill your information from your profile</p>
                        </button>
                        <button
                          onClick={() => handleBookingTypeSelect('other')}
                          className="bg-black/30 rounded-lg p-6 border-2 border-gray-700 hover:border-yellow-400 transition-all text-left"
                        >
                          <div className="text-4xl mb-3">👥</div>
                          <h4 className="text-yellow-400 font-bold text-lg mb-2">Book for Another Person</h4>
                          <p className="text-gray-400 text-sm">Enter passenger information manually</p>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Passenger Information Form */}
                {bookingType === 'other' && !bookingComplete && (
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl p-6 border-2 border-gray-700">
                    <h3 className="text-xl font-bold text-yellow-400 mb-4">Passenger Information</h3>
                    <div className="bg-black/30 rounded-lg p-4 border border-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">First Name *</label>
                          <input
                            type="text"
                            value={passengerInfo.firstName}
                            onChange={e => setPassengerInfo({...passengerInfo, firstName: e.target.value})}
                            placeholder="First Name"
                            className="w-full p-3 rounded-lg bg-black border-2 border-gray-700 text-white focus:outline-none focus:border-yellow-400"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">Middle Name</label>
                          <input
                            type="text"
                            value={passengerInfo.middleName}
                            onChange={e => setPassengerInfo({...passengerInfo, middleName: e.target.value})}
                            placeholder="Middle Name"
                            className="w-full p-3 rounded-lg bg-black border-2 border-gray-700 text-white focus:outline-none focus:border-yellow-400"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">Last Name *</label>
                          <input
                            type="text"
                            value={passengerInfo.lastName}
                            onChange={e => setPassengerInfo({...passengerInfo, lastName: e.target.value})}
                            placeholder="Last Name"
                            className="w-full p-3 rounded-lg bg-black border-2 border-gray-700 text-white focus:outline-none focus:border-yellow-400"
                            required
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-gray-400 text-sm mb-2">Phone Number (Optional)</label>
                          <input
                            type="tel"
                            value={passengerInfo.phoneNumber}
                            onChange={e => setPassengerInfo({...passengerInfo, phoneNumber: e.target.value})}
                            placeholder="09XX XXX XXXX"
                            className="w-full p-3 rounded-lg bg-black border-2 border-gray-700 text-white focus:outline-none focus:border-yellow-400"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">Date of Birth *</label>
                          <input
                            type="date"
                            value={passengerInfo.dateOfBirth}
                            onChange={e => handleDateOfBirthChange(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full p-3 rounded-lg bg-black border-2 border-gray-700 text-white focus:outline-none focus:border-yellow-400"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">Gender *</label>
                          <select
                            value={passengerInfo.gender}
                            onChange={e => setPassengerInfo({...passengerInfo, gender: e.target.value})}
                            className="w-full p-3 rounded-lg bg-black border-2 border-gray-700 text-white focus:outline-none focus:border-yellow-400"
                            required
                          >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">Age</label>
                          <input
                            type="text"
                            value={passengerInfo.age ? `${passengerInfo.age} years` : ''}
                            readOnly
                            placeholder="Calculated from date of birth"
                            className="w-full p-3 rounded-lg bg-gray-800 border-2 border-gray-700 text-gray-400 cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setBookingType(null)}
                      className="mt-4 text-gray-400 hover:text-yellow-400 text-sm underline"
                    >
                      ← Change booking option
                    </button>
                  </div>
                )}

                {/* Passenger Info Display (when using profile) */}
                {bookingType === 'profile' && user && !bookingComplete && (
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl p-6 border-2 border-gray-700">
                    <h3 className="text-xl font-bold text-yellow-400 mb-4">Passenger Information</h3>
                    <div className="bg-black/30 rounded-lg p-4 border border-gray-700">
                      <div className="text-white">
                        <div className="text-lg font-semibold mb-2">{user.firstName} {user.middleName || ''} {user.lastName}</div>
                        {user.phoneNumber && <div className="text-gray-400 text-sm">Phone: {user.phoneNumber}</div>}
                        <div className="text-gray-400 text-sm">Email: {user.email}</div>
                        {user.dateOfBirth && (
                          <div className="text-gray-400 text-sm">
                            Date of Birth: {new Date(user.dateOfBirth).toLocaleDateString()}
                            {(() => {
                              const age = calculateAge(user.dateOfBirth);
                              return age ? ` (Age: ${age} years)` : '';
                            })()}
                          </div>
                        )}
                        {user.gender && <div className="text-gray-400 text-sm">Gender: {user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}</div>}
                      </div>
                    </div>
                    <button
                      onClick={() => setBookingType(null)}
                      className="mt-4 text-gray-400 hover:text-yellow-400 text-sm underline"
                    >
                      ← Change booking option
                    </button>
                  </div>
                )}

                {/* Seat Selection */}
                {bookingType && schedule && !bookingComplete && (
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl p-6 border-2 border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-yellow-400">Select Seat</h3>
                      <button
                        onClick={() => setShowSeatSelector(!showSeatSelector)}
                        className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-all"
                      >
                        {showSeatSelector ? 'Hide Seats' : 'Select Seat'}
                      </button>
                    </div>
                    <div className="mb-4">
                      <span className="text-gray-400">Available Seats: </span>
                      <span className={`font-semibold ${availableSeats > 10 ? 'text-green-400' : availableSeats > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {availableSeats}
                      </span>
                      {selectedSeat && (
                        <span className="ml-4 text-yellow-400">
                          Selected: {selectedSeat}
                        </span>
                      )}
                    </div>
                    {showSeatSelector && (
                      <>
                        <div className="grid grid-cols-10 gap-2 mb-4">
                          {seatNumbers.map(seatNum => {
                            const isSelected = selectedSeat === seatNum;
                            const isAvailable = seatNum <= availableSeats;
                            return (
                              <button
                                key={seatNum}
                                onClick={() => isAvailable && toggleSeat(seatNum)}
                                disabled={!isAvailable}
                                className={`p-3 rounded-lg font-semibold transition-all ${
                                  isSelected
                                    ? 'bg-yellow-400 text-black scale-110'
                                    : isAvailable
                                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                {seatNum}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-700 rounded"></div>
                            <span className="text-gray-400">Available</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                            <span className="text-gray-400">Selected</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-800 rounded"></div>
                            <span className="text-gray-400">Unavailable</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* No Schedule Message */}
                {bookingType && !schedule && !bookingComplete && (
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl p-6 border-2 border-gray-700">
                    <div className="text-center py-8">
                      <p className="text-yellow-400 text-lg mb-2">No schedules available for this route</p>
                      <p className="text-gray-400 text-sm mb-4">Please check back later or contact the company</p>
                      <button
                        onClick={() => setBookingType(null)}
                        className="text-gray-400 hover:text-yellow-400 text-sm underline"
                      >
                        ← Go back
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Route Info Card */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl p-6 border-2 border-yellow-400">
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                {route.busImage && (
                  <div className="w-full md:w-64 h-48 rounded-lg overflow-hidden border-2 border-yellow-400 flex-shrink-0">
                    <img
                      src={`${API_BASE_URL}${route.busImage}`}
                      alt={`${route.from} to ${route.to}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    {route.company?.logo && (
                      <img
                        src={`${API_BASE_URL}${route.company.logo}`}
                        alt={route.company.name}
                        className="w-16 h-16 object-contain rounded-lg bg-white p-2 border-2 border-yellow-400"
                      />
                    )}
                    <div>
                      <h2 className="text-2xl font-bold text-yellow-400">{route.company?.name || 'Unknown Company'}</h2>
                      {ratingData.average > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-yellow-400">⭐</span>
                          <span className="text-yellow-400 font-bold">{ratingData.average.toFixed(1)}</span>
                          <span className="text-gray-400 text-sm">({ratingData.count} reviews)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-6">
                    {route.from} → {route.to}
                  </div>
                  
                  {/* Route Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-black/30 rounded-lg p-4 border border-yellow-400/30">
                      <div className="text-gray-400 text-xs mb-1">Price per Seat</div>
                      <div className="text-yellow-400 font-bold text-xl">ETB {route.price}</div>
                    </div>
                    {route.distance && (
                      <div className="bg-black/30 rounded-lg p-4 border border-yellow-400/30">
                        <div className="text-gray-400 text-xs mb-1">Distance</div>
                        <div className="text-yellow-400 font-semibold text-lg">{route.distance} km</div>
                      </div>
                    )}
                    {route.duration && (
                      <div className="bg-black/30 rounded-lg p-4 border border-yellow-400/30">
                        <div className="text-gray-400 text-xs mb-1">Duration</div>
                        <div className="text-white font-semibold">{route.duration}</div>
                      </div>
                    )}
                    {schedule?.bus?.type && (
                      <div className="bg-black/30 rounded-lg p-4 border border-yellow-400/30">
                        <div className="text-gray-400 text-xs mb-1">Bus Type</div>
                        <div className="text-white font-semibold">{schedule.bus.type}</div>
                      </div>
                    )}
                  </div>
                  
                  {schedule && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-black/30 rounded-lg p-4 border border-yellow-400/30">
                        <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                          <span>🚌</span> <span>Departure</span>
                        </div>
                        <div className="text-yellow-400 font-bold">{formatDate(schedule.departure)}</div>
                      </div>
                      <div className="bg-black/30 rounded-lg p-4 border border-yellow-400/30">
                        <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                          <span>📍</span> <span>Arrival</span>
                        </div>
                        <div className="text-yellow-400 font-bold">{formatDate(schedule.arrival)}</div>
                      </div>
                    </div>
                  )}
                  
                  {schedule?.bus?.plate && (
                    <div className="mt-4 bg-black/30 rounded-lg p-3 border border-yellow-400/30">
                      <div className="text-gray-400 text-xs mb-1">Bus Plate Number</div>
                      <div className="text-white font-semibold">{schedule.bus.plate}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Rating Section */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="text-xl font-bold text-yellow-400 mb-4">Rate This Route</h3>
                {userRating > 0 ? (
                  <div className="bg-black/30 rounded-lg p-4">
                    <p className="text-gray-400 mb-2">You rated this route:</p>
                    <div className="flex items-center gap-2 mb-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} className={`text-2xl ${star <= userRating ? 'text-yellow-400' : 'text-gray-600'}`}>
                          ⭐
                        </span>
                      ))}
                      <span className="text-yellow-400 font-semibold ml-2">{userRating}/5</span>
                    </div>
                    {ratingComment && (
                      <p className="text-gray-300 text-sm mt-2">"{ratingComment}"</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-black/30 rounded-lg p-4">
                    <p className="text-gray-400 mb-3">How would you rate this route?</p>
                    <div className="flex items-center gap-2 mb-3">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => submitRating(star)}
                          disabled={submittingRating}
                          className={`text-3xl transition-transform hover:scale-110 ${star <= userRating ? 'text-yellow-400' : 'text-gray-600'} ${submittingRating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={ratingComment}
                      onChange={e => setRatingComment(e.target.value)}
                      placeholder="Add a comment (optional)"
                      className="w-full p-3 rounded-lg bg-black border-2 border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
                      rows="2"
                    />
                    <button
                      onClick={() => submitRating(userRating || 5)}
                      disabled={submittingRating || userRating === 0}
                      className="mt-2 bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingRating ? 'Submitting...' : 'Submit Rating'}
                    </button>
                  </div>
                )}
              </div>

              {/* Company Logo */}
              {route.company?.logo && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-gray-400 text-sm mb-2">Company</p>
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg">
                      <img
                        src={`${API_BASE_URL}${route.company.logo}`}
                        alt={route.company.name}
                        className="h-12 object-contain"
                      />
                    </div>
                    <div>
                      <p className="text-white font-semibold">{route.company.name}</p>
                      {route.company.contact && (
                        <p className="text-gray-400 text-sm">{route.company.contact}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Payment Card */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl p-6 border-2 border-gray-700 sticky top-4">
              <h3 className="text-xl font-bold text-yellow-400 mb-4">Payment</h3>
              
              {/* Price Summary */}
              <div className="bg-black/30 rounded-lg p-4 mb-4">
                {route.distance && (
                  <div className="flex justify-between mb-3 pb-3 border-b border-gray-700">
                    <span className="text-gray-400">Distance:</span>
                    <span className="text-yellow-400 font-semibold">{route.distance} km</span>
                  </div>
                )}
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Price per seat:</span>
                  <span className="text-white">ETB {route.price}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Seat selected:</span>
                  <span className="text-white">{selectedSeat ? 1 : 0}</span>
                </div>
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-yellow-400 font-semibold">Total:</span>
                    <span className="text-yellow-400 font-bold text-xl">ETB {totalPrice}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method - Only show before booking */}
              {!bookingComplete && bookingType && (
                <div className="mb-4">
                  <label className="block text-gray-400 text-sm mb-2">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full p-3 rounded-lg bg-black border-2 border-gray-700 text-white focus:outline-none focus:border-yellow-400"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="mobile">Mobile Payment</option>
                  </select>
                </div>
              )}

              {/* Debug Info - Remove in production */}
              {showBookingForm && !bookingComplete && bookingType && (
                <div className="mb-2 p-2 bg-gray-800 rounded text-xs text-gray-400">
                  <div>Selected Seat: {selectedSeat || 'None'}</div>
                  <div>Form Valid: {isFormValid ? 'Yes' : 'No'}</div>
                  <div>Button Disabled: {isSubmitButtonDisabled ? 'Yes' : 'No'}</div>
                  {bookingType === 'other' && (
                    <>
                      <div>First Name: {passengerInfo.firstName?.trim() ? '✓' : '✗'}</div>
                      <div>Last Name: {passengerInfo.lastName?.trim() ? '✓' : '✗'}</div>
                      <div>Date of Birth: {passengerInfo.dateOfBirth ? '✓' : '✗'}</div>
                      <div>Gender: {passengerInfo.gender ? '✓' : '✗'}</div>
                    </>
                  )}
                  {bookingType === 'profile' && (
                    <>
                      <div>User: {user ? '✓' : '✗'}</div>
                      <div>First Name: {user?.firstName ? '✓' : '✗'}</div>
                      <div>Last Name: {user?.lastName ? '✓' : '✗'}</div>
                    </>
                  )}
                </div>
              )}

              {/* Submit Booking Button - Only show in booking form */}
              {showBookingForm && !bookingComplete && bookingType && selectedSeat && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('=== SUBMIT BUTTON CLICKED ===');
                    console.log('Form valid:', isFormValid);
                    console.log('Button disabled:', isSubmitButtonDisabled);
                    console.log('Booking type:', bookingType);
                    console.log('Passenger info:', passengerInfo);
                    console.log('User:', user);
                    console.log('Selected seat:', selectedSeat);
                    console.log('Processing:', processing);
                    if (!isSubmitButtonDisabled) {
                      console.log('Calling handleBooking...');
                      handleBooking();
                    } else {
                      console.log('Button is disabled. Reasons:');
                      console.log('- Processing:', processing);
                      console.log('- Selected seat:', selectedSeat);
                      console.log('- Form valid:', isFormValid);
                      console.log('- Show booking form:', showBookingForm);
                      console.log('- Booking complete:', bookingComplete);
                      console.log('- Booking type:', bookingType);
                      alert('Please fill in all required fields and select a seat');
                    }
                  }}
                  disabled={isSubmitButtonDisabled}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-6 py-4 rounded-lg font-bold hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  style={{ cursor: isSubmitButtonDisabled ? 'not-allowed' : 'pointer' }}
                >
                  {processing ? 'Submitting...' : 'Submit Booking'}
                </button>
              )}

              {showBookingForm && selectedSeat && !bookingComplete && (
                <div className="mt-4 text-sm text-gray-400">
                  <p>Selected seat: {selectedSeat}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

