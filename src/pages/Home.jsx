import React, { useState } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Home() {
  const [from, setFrom] = useState('Addis Ababa');
  const [to, setTo] = useState('Dire Dawa');
  const [date, setDate] = useState('');
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="max-w-4xl mx-auto text-yellow-400">
      <h1 className="text-3xl font-bold mb-4">Search Bus Routes</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <input
          value={from}
          onChange={e => setFrom(e.target.value)}
          placeholder="From"
          className="p-3 rounded border border-yellow-400 bg-black text-yellow-400"
        />
        <input
          value={to}
          onChange={e => setTo(e.target.value)}
          placeholder="To"
          className="p-3 rounded border border-yellow-400 bg-black text-yellow-400"
        />
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          min={getTodayDate()}
          placeholder="Date (optional)"
          className="p-3 rounded border border-yellow-400 bg-black text-yellow-400"
        />
      </div>

      <button
        onClick={search}
        className="bg-yellow-400 text-black px-4 py-2 rounded font-bold hover:bg-yellow-500"
      >
        {loading ? 'Searching...' : 'Search'}
      </button>

      <div className="mt-6 space-y-4">
        {routes.length === 0 && !loading && (
          <div className="text-gray-400 mt-4">
            No routes found. Try searching or ask companies to add routes.
          </div>
        )}

        {routes.map(route => {
          const hasSchedules = route.schedules && route.schedules.length > 0;
          
          if (!hasSchedules) {
            // Route without schedules
            return (
              <div key={route._id} className="p-4 rounded bg-gray-900">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {route.company?.logo && (
                      <img
                        src={`${API_BASE_URL}${route.company.logo}`}
                        alt={route.company.name}
                        className="w-20 h-20 object-contain rounded bg-white p-2 border-2 border-yellow-400"
                      />
                    )}
                    <div className="mb-2 sm:mb-0">
                      <div className="font-semibold text-lg">{route.company?.name || 'Unknown Company'}</div>
                      <div className="text-sm text-gray-400">{route.from} → {route.to}</div>
                      <div className="mt-1">Price: <strong>ETB {route.price}</strong></div>
                      {route.duration && <div className="text-sm text-gray-400">Duration: {route.duration}</div>}
                      <div className="text-sm text-yellow-300 mt-2">No schedules available yet</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // Route with schedules - show each schedule
          return route.schedules.map(schedule => (
            <div key={`${route._id}-${schedule._id}`} className="p-4 rounded bg-gray-900">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-start gap-4 flex-1">
                  {/* Company Logo */}
                  {route.company?.logo && (
                    <img
                      src={`${API_BASE_URL}${route.company.logo}`}
                      alt={route.company.name}
                      className="w-20 h-20 object-contain rounded bg-white p-2 border-2 border-yellow-400 flex-shrink-0"
                    />
                  )}
                  
                  <div className="flex-1">
                    <div className="font-semibold text-lg text-yellow-400">{route.company?.name || 'Unknown Company'}</div>
                    <div className="text-sm text-gray-300 mt-1">{route.from} → {route.to}</div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                      <div>
                        <div className="text-gray-400">Departure</div>
                        <div className="text-yellow-400 font-semibold">{formatDate(schedule.departure)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Arrival</div>
                        <div className="text-yellow-400 font-semibold">{formatDate(schedule.arrival)}</div>
                      </div>
                    </div>

                    <div className="flex gap-4 mt-3 text-sm flex-wrap">
                      <div>
                        <span className="text-gray-400">Price: </span>
                        <span className="text-yellow-400 font-bold text-lg">ETB {route.price}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Seats Available: </span>
                        <span className={`font-semibold ${schedule.seatsLeft > 10 ? 'text-green-400' : schedule.seatsLeft > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {schedule.seatsLeft || schedule.bus?.seats || 'N/A'}
                        </span>
                      </div>
                      {route.duration && (
                        <div>
                          <span className="text-gray-400">Duration: </span>
                          <span className="text-yellow-400">{route.duration}</span>
                        </div>
                      )}
                    </div>

                    {schedule.bus && (
                      <div className="flex items-center gap-3 mt-3">
                        {/* Bus Image */}
                        {schedule.bus.image && (
                          <img
                            src={`${API_BASE_URL}${schedule.bus.image}`}
                            alt={schedule.bus.plate}
                            className="w-24 h-16 object-cover rounded border-2 border-yellow-400"
                          />
                        )}
                        <div className="text-xs text-gray-400">
                          Bus: {schedule.bus.plate} ({schedule.bus.type})
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  {schedule.seatsLeft > 0 ? (
                    <Link
                      to={`/booking/${route._id}?scheduleId=${schedule._id}`}
                      className="bg-yellow-400 text-black px-4 py-2 rounded font-semibold hover:bg-yellow-500 text-center"
                    >
                      Book Now
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="bg-gray-600 text-gray-400 px-4 py-2 rounded font-semibold cursor-not-allowed"
                    >
                      Sold Out
                    </button>
                  )}
                </div>
              </div>
            </div>
          ));
        })}
      </div>
    </div>
  );
}
