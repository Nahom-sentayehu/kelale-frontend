import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Home() {
  const [from, setFrom] = useState('Addis Ababa');
  const [to, setTo] = useState('Dire Dawa');
  const [date, setDate] = useState('');
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  async function search() {
    setLoading(true);
    try {
      let url = `/api/routes?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
      if (date) {
        url += `&date=${encodeURIComponent(date)}`;
      }
      const res = await api.get(url);
      setRoutes(res.data);
    } catch (e) {
      alert('Error fetching routes: ' + (e?.response?.data?.error || e.message));
    }
    setLoading(false);
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getTodayDate() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().slice(0, 10);
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

  function handleDateSelect(year, month, day) {
    const date = new Date(year, month, day);
    const dateString = date.toISOString().slice(0, 10);
    setDate(dateString);
    setShowDatePicker(false);
  }

  function navigateMonth(direction) {
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

  useEffect(() => {
    loadCities();
    // Trigger animation on mount
    setIsLoaded(true);
    setIsAnimating(true);
    
    // Stop animation after 15 seconds
    const animationTimer = setTimeout(() => {
      setIsAnimating(false);
    }, 15000);
    
    return () => clearTimeout(animationTimer);
  }, []);

  // Close date picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (showDatePicker && !event.target.closest('.date-picker-container')) {
        setShowDatePicker(false);
      }
    }

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDatePicker]);

  async function loadCities() {
    try {
      const res = await api.get('/api/routes/cities');
      setCities(res.data);
    } catch (e) {
      console.error('Error loading cities:', e);
    }
  }

  function handleFromChange(value) {
    setFrom(value);
    if (value) {
      const filtered = cities.filter(city => 
        city.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 10);
      setFromSuggestions(filtered);
    } else {
      setFromSuggestions([]);
    }
  }

  function handleToChange(value) {
    setTo(value);
    if (value) {
      const filtered = cities.filter(city => 
        city.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 10);
      setToSuggestions(filtered);
    } else {
      setToSuggestions([]);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className={`text-center mb-8 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
        <div className="flex flex-col items-center justify-center gap-4 mb-4">
          <img 
            src="/logo.svg" 
            alt="Kelale Transport Logo" 
            className={`h-24 w-auto transition-all duration-1000 delay-300 hover:scale-110 hover:rotate-2 ${isAnimating ? 'logo-3d' : ''} ${isLoaded ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 rotate-12'}`}
          />
          <h1 className={`text-4xl font-bold text-yellow-400 transition-all duration-1000 delay-500 ${isAnimating ? 'text-3d' : ''} ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            KELALE TRANSPORT
          </h1>
        </div>
        <p className={`text-gray-400 text-lg transition-all duration-1000 delay-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          Book intercity buses across Ethiopia
        </p>
      </div>

      {/* Search Form */}
      <div className={`bg-gray-900 rounded-lg p-6 mb-8 shadow-lg transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="relative">
            <label className="block text-yellow-400 text-sm font-semibold mb-2">From</label>
            <input
              value={from}
              onChange={e => handleFromChange(e.target.value)}
              placeholder="Departure city"
              className="w-full p-3 rounded-lg border-2 border-yellow-400 bg-black text-yellow-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            {fromSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-gray-800 border-2 border-yellow-400 rounded-lg max-h-40 overflow-y-auto">
                {fromSuggestions.map(city => (
                  <div
                    key={city}
                    onClick={() => {
                      setFrom(city);
                      setFromSuggestions([]);
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
            <label className="block text-yellow-400 text-sm font-semibold mb-2">To</label>
            <input
              value={to}
              onChange={e => handleToChange(e.target.value)}
              placeholder="Destination city"
              className="w-full p-3 rounded-lg border-2 border-yellow-400 bg-black text-yellow-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            {toSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-gray-800 border-2 border-yellow-400 rounded-lg max-h-40 overflow-y-auto">
                {toSuggestions.map(city => (
                  <div
                    key={city}
                    onClick={() => {
                      setTo(city);
                      setToSuggestions([]);
                    }}
                    className="p-2 hover:bg-yellow-400 hover:text-black cursor-pointer text-yellow-400"
                  >
                    {city}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="relative date-picker-container">
            <label className="block text-yellow-400 text-sm font-semibold mb-2">Date (Optional)</label>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="w-full text-left p-3 rounded-lg border-2 border-yellow-400 bg-black text-yellow-400 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
            >
              {date ? (
                <div>
                  <div className="text-yellow-400 font-bold">{getDateDisplay(date).day}</div>
                  <div className="text-white text-sm">{getDateDisplay(date).date}</div>
                </div>
              ) : (
                <div className="text-gray-400 flex items-center gap-2">
                  <span>📅</span>
                  <span>Select date</span>
                </div>
              )}
            </button>
            {showDatePicker && (
              <div className="absolute z-20 w-full mt-2 bg-black/95 rounded-xl p-4 border-2 border-yellow-400 shadow-2xl">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="text-yellow-400 hover:text-yellow-300 text-xl font-bold px-3 py-1 rounded hover:bg-yellow-400/20 transition-colors"
                  >
                    ‹
                  </button>
                  <h3 className="text-yellow-400 font-bold text-lg">
                    {new Date(calendarYear, calendarMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="text-yellow-400 hover:text-yellow-300 text-xl font-bold px-3 py-1 rounded hover:bg-yellow-400/20 transition-colors"
                  >
                    ›
                  </button>
                </div>
                
                {/* Calendar Days Header */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-gray-400 text-xs font-semibold py-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-2">
                  {generateCalendarDays(calendarYear, calendarMonth).map((day, index) => {
                    if (day === null) {
                      return <div key={index} className="aspect-square"></div>;
                    }
                    const isPast = isDatePast(calendarYear, calendarMonth, day);
                    const isSelected = isDateSelected(calendarYear, calendarMonth, day, date);
                    const isToday = (() => {
                      const today = new Date();
                      return today.getDate() === day && 
                             today.getMonth() === calendarMonth && 
                             today.getFullYear() === calendarYear;
                    })();
                    
                    return (
                      <button
                        key={index}
                        onClick={() => !isPast && handleDateSelect(calendarYear, calendarMonth, day)}
                        disabled={isPast}
                        className={`aspect-square rounded-lg font-semibold transition-all ${
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
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => {
                      const today = new Date();
                      handleDateSelect(today.getFullYear(), today.getMonth(), today.getDate());
                    }}
                    className="text-yellow-400 text-sm hover:text-yellow-300 underline"
                  >
                    Select Today
                  </button>
                </div>
                
                {/* Clear Button */}
                {date && (
                  <div className="mt-2 flex justify-center">
                    <button
                      onClick={() => {
                        setDate('');
                        setShowDatePicker(false);
                      }}
                      className="text-gray-400 text-sm hover:text-gray-300 underline"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={search}
          disabled={loading}
          className="w-full sm:w-auto bg-yellow-400 text-black px-8 py-3 rounded-lg font-bold hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {loading ? 'Searching...' : '🔍 Search Routes'}
        </button>
      </div>

      {/* Results */}
      <div className={`mt-8 transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        {routes.length === 0 && !loading && (
          <div className="text-center py-12 bg-gray-900 rounded-lg">
            <p className="text-gray-400 text-lg">No routes found. Try searching or ask companies to add routes.</p>
          </div>
        )}

        {routes.map(route => {
          const hasSchedules = route.schedules && route.schedules.length > 0;
          
          if (!hasSchedules) {
            // Route without schedules - Card style
            return (
              <div key={route._id} className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl p-6 mb-6 border-2 border-gray-700 hover:border-yellow-400 transition-all">
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Bus Image Only */}
                  {route.busImage && (
                    <div className="w-48 h-32 rounded-lg overflow-hidden border-2 border-yellow-400 flex-shrink-0">
                      <img
                        src={`${API_BASE_URL}${route.busImage}`}
                        alt={`${route.from} to ${route.to}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Route Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      {route.company?.logo && (
                        <img
                          src={`${API_BASE_URL}${route.company.logo}`}
                          alt={route.company.name}
                          className="w-12 h-12 object-contain rounded-lg bg-white p-1 border border-yellow-400"
                        />
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-yellow-400">{route.company?.name || 'Unknown Company'}</h3>
                        {route.rating && route.rating.average > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-yellow-400">⭐</span>
                            <span className="text-yellow-400 font-semibold text-sm">{route.rating.average.toFixed(1)}</span>
                            <span className="text-gray-400 text-xs">({route.rating.count} reviews)</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-white mb-4">
                      {route.from} → {route.to}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="bg-black/30 rounded-lg p-3">
                        <div className="text-gray-400 text-xs mb-1">Price per Seat</div>
                        <div className="text-yellow-400 font-bold text-lg">ETB {route.price}</div>
                      </div>
                      {route.distance && (
                        <div className="bg-black/30 rounded-lg p-3">
                          <div className="text-gray-400 text-xs mb-1">Distance</div>
                          <div className="text-yellow-400 font-semibold">{route.distance} km</div>
                        </div>
                      )}
                      {route.duration && (
                        <div className="bg-black/30 rounded-lg p-3">
                          <div className="text-gray-400 text-xs mb-1">Duration</div>
                          <div className="text-white font-semibold">{route.duration}</div>
                        </div>
                      )}
                      {route.bus?.type && (
                        <div className="bg-black/30 rounded-lg p-3">
                          <div className="text-gray-400 text-xs mb-1">Bus Type</div>
                          <div className="text-white font-semibold">{route.bus.type}</div>
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <span className="inline-block bg-yellow-400/20 text-yellow-300 px-4 py-2 rounded-full text-sm font-semibold border border-yellow-400/50">
                        ⏰ No schedules available yet
                      </span>
                    </div>
                  </div>
                  
                  {/* Details Button */}
                  <div className="flex items-center">
                    <Link
                      to={`/route-details/${route._id}`}
                      className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-6 py-3 rounded-lg font-bold hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-lg"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            );
          }

          // Get total available seats across all schedules
          const totalAvailableSeats = route.schedules.reduce((sum, s) => sum + (s.seatsLeft || s.bus?.seats || 0), 0);

          // Route with schedules - show each schedule as a card
          return route.schedules.map(schedule => (
            <div key={`${route._id}-${schedule._id}`} className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl p-6 mb-6 border-2 border-gray-700 hover:border-yellow-400 transition-all hover:shadow-2xl">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Bus Image Only */}
                {(route.busImage || schedule.bus?.image) && (
                  <div className="w-48 h-32 rounded-lg overflow-hidden border-2 border-yellow-400 flex-shrink-0">
                    <img
                      src={`${API_BASE_URL}${route.busImage || schedule.bus.image}`}
                      alt={schedule.bus?.plate || 'Bus'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* Main Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    {route.company?.logo && (
                      <img
                        src={`${API_BASE_URL}${route.company.logo}`}
                        alt={route.company.name}
                        className="w-12 h-12 object-contain rounded-lg bg-white p-1 border border-yellow-400"
                      />
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-yellow-400">{route.company?.name || 'Unknown Company'}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {route.rating && route.rating.average > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-400">⭐</span>
                            <span className="text-yellow-400 font-semibold text-sm">{route.rating.average.toFixed(1)}</span>
                            <span className="text-gray-400 text-xs">({route.rating.count} reviews)</span>
                          </div>
                        )}
                        {schedule.bus?.type && (
                          <span className="bg-yellow-400/20 text-yellow-300 px-2 py-1 rounded text-xs font-semibold">
                            {schedule.bus.type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-2xl font-bold text-white mb-4">
                    {route.from} → {route.to}
                  </div>
                  
                  {/* Time Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
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
                  
                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-black/30 rounded-lg p-3 border border-yellow-400/30">
                      <div className="text-gray-400 text-xs mb-1">Price per Seat</div>
                      <div className="text-yellow-400 font-bold text-lg">ETB {route.price}</div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 border border-yellow-400/30">
                      <div className="text-gray-400 text-xs mb-1">Available Seats</div>
                      <div className={`font-bold text-lg ${(schedule.seatsLeft || route.availableSeats || schedule.bus?.seats || 0) > 10 ? 'text-green-400' : (schedule.seatsLeft || route.availableSeats || schedule.bus?.seats || 0) > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {schedule.seatsLeft !== undefined && schedule.seatsLeft !== null ? schedule.seatsLeft : route.availableSeats !== undefined && route.availableSeats !== null ? route.availableSeats : schedule.bus?.seats || route.bus?.seats || 'N/A'}
                      </div>
                    </div>
                    {route.distance && (
                      <div className="bg-black/30 rounded-lg p-3 border border-yellow-400/30">
                        <div className="text-gray-400 text-xs mb-1">Distance</div>
                        <div className="text-white font-semibold">{route.distance} km</div>
                      </div>
                    )}
                    {schedule.bus?.plate && (
                      <div className="bg-black/30 rounded-lg p-3 border border-yellow-400/30">
                        <div className="text-gray-400 text-xs mb-1">Bus Plate</div>
                        <div className="text-white font-semibold">{schedule.bus.plate}</div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col gap-3 items-center lg:items-start">
                  <Link
                    to={`/route-details/${route._id}?scheduleId=${schedule._id}`}
                    className="bg-black border-2 border-yellow-600 text-yellow-500 px-6 py-3 rounded-lg font-bold hover:bg-yellow-600 hover:text-black transition-all shadow-lg text-center min-w-[140px]"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </div>
          ));
        })}
      </div>
    </div>
  );
}
