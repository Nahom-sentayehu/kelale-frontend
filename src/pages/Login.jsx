import React, { useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function Login(){
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const nav = useNavigate();

  async function submit(e){
    e.preventDefault();
    try{
      const res = await api.post('/api/auth/login',{email,password});
      localStorage.setItem('kelale_token', res.data.token);
      localStorage.setItem('kelale_user', JSON.stringify(res.data.user));
      // Dispatch event to update user state in App
      window.dispatchEvent(new Event('userUpdated'));
      alert('Logged in');
      nav('/');
    }catch(e){ alert('Login failed: '+(e?.response?.data?.msg || e.message)); }
  }

  return (
    <div className="max-w-md mx-auto bg-yellow-600 p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4 text-black">Login</h2>
      <form onSubmit={submit} className="space-y-3">
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full p-2 border border-black rounded bg-white text-black" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full p-2 border border-black rounded bg-white text-black" />
        <button className="w-full bg-black text-yellow-400 p-2 rounded">Login</button>
      </form>
    </div>
  )
}
