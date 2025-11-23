import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Profile(){
  const [user,setUser] = useState(null);
  const [bookings,setBookings] = useState([]);

  useEffect(()=>{
    const u = localStorage.getItem('kelale_user');
    if(u) setUser(JSON.parse(u));
    async function loadBookings(){
      try{
        const token = localStorage.getItem('kelale_token');
        const res = await api.get('/api/bookings/user', { headers: { Authorization: 'Bearer '+token }});
        setBookings(res.data);
      }catch(e){ console.error(e); }
    }
    loadBookings();
  },[]);

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Profile</h2>
      {user ? (
        <div className="bg-yellow-600 p-6 rounded shadow">
          <div className="flex flex-col sm:flex-row gap-6 mb-6">
            {user.profilePhoto && (
              <div>
                <img 
                  src={`${API_BASE_URL}${user.profilePhoto}`} 
                  alt="Profile" 
                  className="w-32 h-32 rounded-full object-cover border-4 border-black"
                />
              </div>
            )}
            <div className="flex-1 text-black">
              <div className="text-2xl font-bold mb-2">
                {user.firstName && user.lastName 
                  ? `${user.firstName}${user.middleName ? ' ' + user.middleName : ''} ${user.lastName}` 
                  : user.name}
              </div>
              <div className="space-y-1 text-sm">
                <div><strong>Email:</strong> {user.email}</div>
                {user.phoneNumber && (
                  <div><strong>Phone:</strong> {user.phoneNumber}</div>
                )}
                <div><strong>Role:</strong> {user.role}</div>
              </div>
            </div>
          </div>

          <h3 className="mt-4 font-semibold text-black text-lg">Bookings</h3>
          <div className="mt-2 space-y-3">
            {bookings.map(b=> (
              <div key={b._id} className="p-3 border-2 border-black rounded bg-white text-black">
                <div className="font-semibold">Route: {b.route?.from} → {b.route?.to}</div>
                <div>Seats: {b.seats.join(', ')}</div>
                <div>Total: ETB {b.total}</div>
                <div>Status: <span className="font-semibold">{b.status}</span></div>
              </div>
            ))}
            {bookings.length===0 && <div className="text-gray-700">No bookings yet.</div>}
          </div>
        </div>
      ) : <div>Please login to view profile.</div>}
    </div>
  )
}
