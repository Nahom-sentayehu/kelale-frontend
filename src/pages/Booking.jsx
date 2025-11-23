import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';

export default function Booking(){
  const { routeId } = useParams();
  const [route, setRoute] = useState(null);
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState('');
  const [seats, setSeats] = useState('1,2');
  const [qr, setQr] = useState(null);

  useEffect(()=>{
    async function load(){
      try{
        const r = await api.get(`/api/routes`);
        const found = r.data.find(x=> x._id === routeId);
        setRoute(found);
        const busesRes = await api.get('/api/buses');
        setBuses(busesRes.data);
        if(busesRes.data[0]) setSelectedBus(busesRes.data[0]._id);
      }catch(e){ console.error(e); }
    }
    load();
  },[routeId]);

  async function book(){
    const token = localStorage.getItem('kelale_token');
    if(!token){ alert('Please login'); return; }
    try{
      const res = await api.post('/api/bookings', { routeId, busId: selectedBus, seats: seats.split(',').map(s=>parseInt(s.trim())) }, { headers: { Authorization: 'Bearer '+token } });
      setQr(res.data.qr);
      alert('Booking confirmed');
    }catch(e){ alert(e?.response?.data?.msg || 'Booking failed') }
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Booking</h2>
      {route ? (
        <div>
          <div className="mb-3">Route: <strong>{route.from} → {route.to}</strong></div>
          <div className="mb-3">Price (per seat): ETB {route.price}</div>
          <div className="mb-3">
            <label className="block mb-1">Select Bus</label>
            <select value={selectedBus} onChange={e=>setSelectedBus(e.target.value)} className="p-2 border rounded w-full">
              {buses.map(b=> <option key={b._id} value={b._id}>{b.company?.name || 'Company'} - {b.plate || b._id}</option>)}
            </select>
          </div>
          <div className="mb-3">
            <label className="block mb-1">Seats (comma separated)</label>
            <input value={seats} onChange={e=>setSeats(e.target.value)} className="p-2 border rounded w-full"/>
          </div>
          <button onClick={book} className="bg-black text-yellow-400 px-4 py-2 rounded">Confirm Booking</button>

          {qr && (
            <div className="mt-4">
              <h3 className="font-semibold">Ticket (QR)</h3>
              <img src={qr} alt="QR code" className="mt-2"/>
            </div>
          )}
        </div>
      ) : <div>Loading route...</div>}
    </div>
  )
}
