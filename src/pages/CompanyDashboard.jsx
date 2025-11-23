import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function CompanyDashboard() {
  const [company, setCompany] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  
  // Form states
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [showBusForm, setShowBusForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  
  // Route form
  const [routeFrom, setRouteFrom] = useState('');
  const [routeTo, setRouteTo] = useState('');
  const [routePrice, setRoutePrice] = useState('');
  const [routeDuration, setRouteDuration] = useState('');
  const [editingRoute, setEditingRoute] = useState(null);
  
  // Bus form
  const [busPlate, setBusPlate] = useState('');
  const [busSeats, setBusSeats] = useState('');
  const [busType, setBusType] = useState('Standard');
  const [busImage, setBusImage] = useState(null);
  const [busImagePreview, setBusImagePreview] = useState(null);
  const [editingBus, setEditingBus] = useState(null);
  
  // Schedule form
  const [scheduleRouteId, setScheduleRouteId] = useState('');
  const [scheduleBusId, setScheduleBusId] = useState('');
  const [scheduleDeparture, setScheduleDeparture] = useState('');
  const [scheduleArrival, setScheduleArrival] = useState('');
  const [editingSchedule, setEditingSchedule] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
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
    } catch (e) {
      console.error(e);
      alert('Error loading data. Make sure you are logged in as a company user.');
    }
  }

  async function handleRouteSubmit(e) {
    e.preventDefault();
    try {
      if (editingRoute) {
        await api.put(`/api/routes/${editingRoute._id}`, {
          from: routeFrom,
          to: routeTo,
          price: parseFloat(routePrice),
          duration: routeDuration
        });
      } else {
        await api.post('/api/routes', {
          from: routeFrom,
          to: routeTo,
          price: parseFloat(routePrice),
          duration: routeDuration
        });
      }
      resetRouteForm();
      loadData();
    } catch (e) {
      alert('Error saving route: ' + (e?.response?.data?.error || e.message));
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
        await api.put(`/api/buses/${editingBus._id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        await api.post('/api/buses', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      resetBusForm();
      loadData();
    } catch (e) {
      alert('Error saving bus: ' + (e?.response?.data?.error || e.message));
    }
  }

  async function handleScheduleSubmit(e) {
    e.preventDefault();
    try {
      if (editingSchedule) {
        await api.put(`/api/schedules/${editingSchedule._id}`, {
          departure: scheduleDeparture,
          arrival: scheduleArrival
        });
      } else {
        await api.post('/api/schedules', {
          routeId: scheduleRouteId,
          busId: scheduleBusId,
          departure: scheduleDeparture,
          arrival: scheduleArrival
        });
      }
      resetScheduleForm();
      loadData();
    } catch (e) {
      alert('Error saving schedule: ' + (e?.response?.data?.error || e.message));
    }
  }

  function resetRouteForm() {
    setRouteFrom('');
    setRouteTo('');
    setRoutePrice('');
    setRouteDuration('');
    setEditingRoute(null);
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
    setEditingSchedule(null);
    setShowScheduleForm(false);
  }

  function editRoute(route) {
    setRouteFrom(route.from);
    setRouteTo(route.to);
    setRoutePrice(route.price);
    setRouteDuration(route.duration || '');
    setEditingRoute(route);
    setShowRouteForm(true);
  }

  function editBus(bus) {
    setBusPlate(bus.plate);
    setBusSeats(bus.seats);
    setBusType(bus.type || 'Standard');
    setBusImage(null);
    setBusImagePreview(bus.image ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${bus.image}` : null);
    setEditingBus(bus);
    setShowBusForm(true);
  }

  function editSchedule(schedule) {
    setScheduleRouteId(schedule.route._id);
    setScheduleBusId(schedule.bus._id);
    setScheduleDeparture(new Date(schedule.departure).toISOString().slice(0, 16));
    setScheduleArrival(new Date(schedule.arrival).toISOString().slice(0, 16));
    setEditingSchedule(schedule);
    setShowScheduleForm(true);
  }

  async function deleteRoute(id) {
    if (!confirm('Delete this route?')) return;
    try {
      await api.delete(`/api/routes/${id}`);
      loadData();
    } catch (e) {
      alert('Error deleting route');
    }
  }

  async function deleteBus(id) {
    if (!confirm('Delete this bus?')) return;
    try {
      await api.delete(`/api/buses/${id}`);
      loadData();
    } catch (e) {
      alert('Error deleting bus');
    }
  }

  async function deleteSchedule(id) {
    if (!confirm('Delete this schedule?')) return;
    try {
      await api.delete(`/api/schedules/${id}`);
      loadData();
    } catch (e) {
      alert('Error deleting schedule');
    }
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Company Dashboard</h2>
      {company && (
        <div className="bg-yellow-600 p-4 rounded shadow mb-6">
          <h3 className="text-black font-bold text-lg">{company.name}</h3>
          {company.description && <p className="text-black text-sm mt-1">{company.description}</p>}
        </div>
      )}

      {/* Routes Section */}
      <div className="bg-yellow-600 p-6 rounded shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-black text-lg">Routes</h3>
          <button
            onClick={() => { resetRouteForm(); setShowRouteForm(!showRouteForm); }}
            className="bg-black text-yellow-400 px-4 py-2 rounded font-semibold hover:bg-gray-800"
          >
            {showRouteForm ? 'Cancel' : '+ Add Route'}
          </button>
        </div>

        {showRouteForm && (
          <form onSubmit={handleRouteSubmit} className="bg-white p-4 rounded mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                value={routeFrom}
                onChange={e => setRouteFrom(e.target.value)}
                placeholder="From"
                className="p-2 border-2 border-black rounded text-black"
                required
              />
              <input
                value={routeTo}
                onChange={e => setRouteTo(e.target.value)}
                placeholder="To"
                className="p-2 border-2 border-black rounded text-black"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={routePrice}
                onChange={e => setRoutePrice(e.target.value)}
                placeholder="Price (ETB)"
                className="p-2 border-2 border-black rounded text-black"
                required
              />
              <input
                value={routeDuration}
                onChange={e => setRouteDuration(e.target.value)}
                placeholder="Duration (e.g., 5 hours)"
                className="p-2 border-2 border-black rounded text-black"
              />
            </div>
            <button type="submit" className="bg-black text-yellow-400 px-4 py-2 rounded font-semibold">
              {editingRoute ? 'Update' : 'Create'} Route
            </button>
          </form>
        )}

        <div className="space-y-2">
          {routes.map(r => (
            <div key={r._id} className="bg-white p-3 rounded flex justify-between items-center">
              <div className="text-black">
                <strong>{r.from} → {r.to}</strong> - ETB {r.price} {r.duration && `(${r.duration})`}
              </div>
              <div className="space-x-2">
                <button onClick={() => editRoute(r)} className="bg-yellow-400 text-black px-3 py-1 rounded text-sm">Edit</button>
                <button onClick={() => deleteRoute(r._id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm">Delete</button>
              </div>
            </div>
          ))}
          {routes.length === 0 && <div className="text-gray-700">No routes yet.</div>}
        </div>
      </div>

      {/* Buses Section */}
      <div className="bg-yellow-600 p-6 rounded shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-black text-lg">Buses</h3>
          <button
            onClick={() => { resetBusForm(); setShowBusForm(!showBusForm); }}
            className="bg-black text-yellow-400 px-4 py-2 rounded font-semibold hover:bg-gray-800"
          >
            {showBusForm ? 'Cancel' : '+ Add Bus'}
          </button>
        </div>

        {showBusForm && (
          <form onSubmit={handleBusSubmit} className="bg-white p-4 rounded mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                value={busPlate}
                onChange={e => setBusPlate(e.target.value)}
                placeholder="Plate Number"
                className="p-2 border-2 border-black rounded text-black"
                required
              />
              <input
                type="number"
                value={busSeats}
                onChange={e => setBusSeats(e.target.value)}
                placeholder="Number of Seats"
                className="p-2 border-2 border-black rounded text-black"
                required
              />
            </div>
            <select
              value={busType}
              onChange={e => setBusType(e.target.value)}
              className="p-2 border-2 border-black rounded text-black w-full"
            >
              <option value="Standard">Standard</option>
              <option value="VIP">VIP</option>
            </select>
            <div>
              <label className="block text-black text-sm font-semibold mb-1">Bus Image (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleBusImageChange}
                className="w-full p-2 border-2 border-black rounded text-black text-sm"
              />
              {busImagePreview && (
                <div className="mt-2">
                  <img
                    src={busImagePreview}
                    alt="Bus preview"
                    className="w-48 h-32 object-cover rounded border-2 border-black"
                  />
                </div>
              )}
            </div>
            <button type="submit" className="bg-black text-yellow-400 px-4 py-2 rounded font-semibold">
              {editingBus ? 'Update' : 'Create'} Bus
            </button>
          </form>
        )}

        <div className="space-y-2">
          {buses.map(b => (
            <div key={b._id} className="bg-white p-3 rounded flex justify-between items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                {b.image && (
                  <img
                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${b.image}`}
                    alt={b.plate}
                    className="w-20 h-16 object-cover rounded border-2 border-black"
                  />
                )}
                <div className="text-black">
                  <strong>{b.plate}</strong> - {b.seats} seats ({b.type})
                </div>
              </div>
              <div className="space-x-2">
                <button onClick={() => editBus(b)} className="bg-yellow-400 text-black px-3 py-1 rounded text-sm">Edit</button>
                <button onClick={() => deleteBus(b._id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm">Delete</button>
              </div>
            </div>
          ))}
          {buses.length === 0 && <div className="text-gray-700">No buses yet.</div>}
        </div>
      </div>

      {/* Schedules Section */}
      <div className="bg-yellow-600 p-6 rounded shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-black text-lg">Schedules</h3>
          <button
            onClick={() => { resetScheduleForm(); setShowScheduleForm(!showScheduleForm); }}
            className="bg-black text-yellow-400 px-4 py-2 rounded font-semibold hover:bg-gray-800"
          >
            {showScheduleForm ? 'Cancel' : '+ Add Schedule'}
          </button>
        </div>

        {showScheduleForm && (
          <form onSubmit={handleScheduleSubmit} className="bg-white p-4 rounded mb-4 space-y-3">
            <select
              value={scheduleRouteId}
              onChange={e => setScheduleRouteId(e.target.value)}
              className="p-2 border-2 border-black rounded text-black w-full"
              required
            >
              <option value="">Select Route</option>
              {routes.map(r => (
                <option key={r._id} value={r._id}>{r.from} → {r.to}</option>
              ))}
            </select>
            <select
              value={scheduleBusId}
              onChange={e => setScheduleBusId(e.target.value)}
              className="p-2 border-2 border-black rounded text-black w-full"
              required
            >
              <option value="">Select Bus</option>
              {buses.map(b => (
                <option key={b._id} value={b._id}>{b.plate} ({b.seats} seats)</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-black text-sm mb-1">Departure</label>
                <input
                  type="datetime-local"
                  value={scheduleDeparture}
                  onChange={e => setScheduleDeparture(e.target.value)}
                  className="p-2 border-2 border-black rounded text-black w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-black text-sm mb-1">Arrival</label>
                <input
                  type="datetime-local"
                  value={scheduleArrival}
                  onChange={e => setScheduleArrival(e.target.value)}
                  className="p-2 border-2 border-black rounded text-black w-full"
                  required
                />
              </div>
            </div>
            <button type="submit" className="bg-black text-yellow-400 px-4 py-2 rounded font-semibold">
              {editingSchedule ? 'Update' : 'Create'} Schedule
            </button>
          </form>
        )}

        <div className="space-y-2">
          {schedules.map(s => (
            <div key={s._id} className="bg-white p-3 rounded">
              <div className="flex justify-between items-start">
                <div className="text-black">
                  <strong>{s.route?.from} → {s.route?.to}</strong>
                  <div className="text-sm mt-1">
                    Bus: {s.bus?.plate} | Departure: {formatDate(s.departure)} | Arrival: {formatDate(s.arrival)}
                  </div>
                  <div className="text-sm">Seats Available: {s.seatsLeft || s.bus?.seats || 'N/A'}</div>
                </div>
                <div className="space-x-2">
                  <button onClick={() => editSchedule(s)} className="bg-yellow-400 text-black px-3 py-1 rounded text-sm">Edit</button>
                  <button onClick={() => deleteSchedule(s._id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm">Delete</button>
                </div>
              </div>
            </div>
          ))}
          {schedules.length === 0 && <div className="text-gray-700">No schedules yet.</div>}
        </div>
      </div>
    </div>
  );
}

