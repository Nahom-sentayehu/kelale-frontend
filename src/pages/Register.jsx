import React, { useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function Register(){
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const nav = useNavigate();

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (file) {
      setProfilePhoto(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  async function submit(e){
    e.preventDefault();
    try{
      const formData = new FormData();
      formData.append('firstName', firstName);
      formData.append('middleName', middleName);
      formData.append('lastName', lastName);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('phoneNumber', phoneNumber);
      formData.append('role', 'customer');
      if (profilePhoto) {
        formData.append('profilePhoto', profilePhoto);
      }

      const res = await api.post('/api/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      localStorage.setItem('kelale_token', res.data.token);
      localStorage.setItem('kelale_user', JSON.stringify(res.data.user));
      // Dispatch event to update user state in App
      window.dispatchEvent(new Event('userUpdated'));
      alert('Registered successfully!');
      nav('/');
    }catch(e){ 
      alert('Registration failed: '+(e?.response?.data?.message || e?.response?.data?.error || e.message)); 
    }
  }

  return (
    <div className="max-w-md mx-auto bg-yellow-600 p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4 text-black">Register</h2>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <input 
            value={firstName} 
            onChange={e=>setFirstName(e.target.value)} 
            placeholder="First Name" 
            required
            className="w-full p-2 border border-black rounded bg-white text-black" 
          />
          <input 
            value={middleName} 
            onChange={e=>setMiddleName(e.target.value)} 
            placeholder="Middle Name" 
            className="w-full p-2 border border-black rounded bg-white text-black" 
          />
          <input 
            value={lastName} 
            onChange={e=>setLastName(e.target.value)} 
            placeholder="Last Name" 
            required
            className="w-full p-2 border border-black rounded bg-white text-black" 
          />
        </div>
        <input 
          value={email} 
          onChange={e=>setEmail(e.target.value)} 
          type="email"
          placeholder="Email" 
          required
          className="w-full p-2 border border-black rounded bg-white text-black" 
        />
        <input 
          value={phoneNumber} 
          onChange={e=>setPhoneNumber(e.target.value)} 
          placeholder="Phone Number" 
          className="w-full p-2 border border-black rounded bg-white text-black" 
        />
        <input 
          type="password" 
          value={password} 
          onChange={e=>setPassword(e.target.value)} 
          placeholder="Password" 
          required
          className="w-full p-2 border border-black rounded bg-white text-black" 
        />
        
        <div>
          <label className="block text-black mb-2 text-sm font-semibold">Profile Photo (Optional)</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={handlePhotoChange}
            className="w-full p-2 border border-black rounded bg-white text-black text-sm"
          />
          {photoPreview && (
            <div className="mt-2">
              <img 
                src={photoPreview} 
                alt="Preview" 
                className="w-24 h-24 object-cover rounded border-2 border-black"
              />
            </div>
          )}
        </div>

        <button type="submit" className="w-full bg-black text-yellow-400 p-2 rounded font-semibold">
          Register
        </button>
      </form>
    </div>
  )
}
