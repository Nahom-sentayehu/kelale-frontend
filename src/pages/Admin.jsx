import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Admin(){
  const [activeTab, setActiveTab] = useState('dashboard');
  const [companies,setCompanies] = useState([]);
  const [buses,setBuses] = useState([]);
  const [routes,setRoutes] = useState([]);
  const [companyUsers, setCompanyUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  
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

  useEffect(()=>{ loadAll(); },[]);

  async function loadAll(){
    try{
      const [c, b, r, users] = await Promise.all([
        api.get('/api/companies'),
        api.get('/api/buses'),
        api.get('/api/routes'),
        api.get('/api/users')
      ]);
      setCompanies(c.data);
      setBuses(b.data);
      setRoutes(r.data);
      // Filter company users
      const companyUsersList = users.data.filter(u => u.role === 'company');
      setCompanyUsers(companyUsersList);
      // Filter customers
      const customersList = users.data.filter(u => u.role === 'customer');
      setCustomers(customersList);
    }catch(e){ console.error(e); }
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
      // Try to find user in companyUsers list
      const user = companyUsers.find(u => {
        // Check if user ID matches
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
      
      // Don't set Content-Type manually - let browser set it with boundary for multipart/form-data
      console.log('Sending request to:', '/api/companies');
      console.log('API base URL:', import.meta.env.VITE_API_URL || 'http://localhost:5000');
      console.log('Token exists:', !!localStorage.getItem('kelale_token'));
      
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
      console.error('Company registration error:', {
        status: statusCode,
        message: errorMsg,
        data: e?.response?.data,
        fullError: e
      });
      alert(`Failed to add company (${statusCode || 'N/A'}): ${errorMsg}\n\nPlease make sure you are logged in as admin.`); 
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Admin Dashboard</h2>
      
      {/* Navigation Tabs */}
      <div className="flex space-x-2 mb-6 border-b-2 border-yellow-600">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'dashboard'
              ? 'bg-yellow-600 text-black border-b-2 border-black'
              : 'text-yellow-400 hover:bg-gray-800'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('register-company')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'register-company'
              ? 'bg-yellow-600 text-black border-b-2 border-black'
              : 'text-yellow-400 hover:bg-gray-800'
          }`}
        >
          Register Company
        </button>
        <button
          onClick={() => setActiveTab('password-reset')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'password-reset'
              ? 'bg-yellow-600 text-black border-b-2 border-black'
              : 'text-yellow-400 hover:bg-gray-800'
          }`}
        >
          Reset Password
        </button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-yellow-600 p-6 rounded shadow flex items-center gap-4">
              <div className="text-5xl">🏢</div>
              <div>
                <div className="text-black font-bold text-3xl">{companies.length}</div>
                <div className="text-black text-sm font-semibold">Total Companies</div>
              </div>
            </div>
            <div className="bg-yellow-600 p-6 rounded shadow flex items-center gap-4">
              <div className="text-5xl">🚌</div>
              <div>
                <div className="text-black font-bold text-3xl">{buses.length}</div>
                <div className="text-black text-sm font-semibold">Total Buses</div>
              </div>
            </div>
            <div className="bg-yellow-600 p-6 rounded shadow flex items-center gap-4">
              <div className="text-5xl">🛣️</div>
              <div>
                <div className="text-black font-bold text-3xl">{routes.length}</div>
                <div className="text-black text-sm font-semibold">Total Routes</div>
              </div>
            </div>
            <div className="bg-yellow-600 p-6 rounded shadow flex items-center gap-4">
              <div className="text-5xl">👥</div>
              <div>
                <div className="text-black font-bold text-3xl">{customers.length}</div>
                <div className="text-black text-sm font-semibold">Total Customers</div>
              </div>
            </div>
          </div>

          {/* Companies List */}
          <div className="bg-yellow-600 p-6 rounded shadow">
            <h3 className="font-semibold mb-4 text-black text-lg">Companies</h3>
            <div className="space-y-2">
              {companies.map(c => (
                <div key={c._id} className="bg-white p-3 rounded flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {c.logo && (
                      <img
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${c.logo}`}
                        alt={c.name}
                        className="w-12 h-12 object-contain rounded bg-white p-1 border border-black"
                      />
                    )}
                    <div className="text-black">
                      <div className="font-semibold">{c.name}</div>
                      {c.description && <div className="text-sm text-gray-600">{c.description}</div>}
                    </div>
                  </div>
                </div>
              ))}
              {companies.length === 0 && <div className="text-gray-700">No companies yet.</div>}
            </div>
          </div>

          {/* Buses and Routes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-yellow-600 p-4 rounded shadow">
              <h3 className="font-semibold mb-2 text-black">Recent Buses</h3>
              <div className="space-y-2">
                {buses.slice(0, 5).map(b => (
                  <div key={b._id} className="p-2 border-b-2 border-black bg-white text-black rounded text-sm">
                    {b.plate} — {b.seats} seats ({b.type})
                  </div>
                ))}
                {buses.length === 0 && <div className="text-gray-700 text-sm">No buses yet.</div>}
              </div>
            </div>
            <div className="bg-yellow-600 p-4 rounded shadow">
              <h3 className="font-semibold mb-2 text-black">Recent Routes</h3>
              <div className="space-y-2">
                {routes.slice(0, 5).map(r => (
                  <div key={r._id} className="p-2 border-b-2 border-black bg-white text-black rounded text-sm">
                    {r.from} → {r.to} (ETB {r.price})
                  </div>
                ))}
                {routes.length === 0 && <div className="text-gray-700 text-sm">No routes yet.</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register Company Tab */}
      {activeTab === 'register-company' && (
        <div className="bg-yellow-600 p-6 rounded shadow">
        <h3 className="font-semibold mb-4 text-black text-lg">Register New Company</h3>
        <form onSubmit={addCompany} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-black text-sm font-semibold mb-1">Company Name *</label>
              <input 
                value={companyName} 
                onChange={e=>setCompanyName(e.target.value)} 
                className="w-full p-2 border-2 border-black rounded bg-white text-black" 
                placeholder="Company name"
                required
              />
            </div>
            <div>
              <label className="block text-black text-sm font-semibold mb-1">Contact</label>
              <input 
                value={companyContact} 
                onChange={e=>setCompanyContact(e.target.value)} 
                className="w-full p-2 border-2 border-black rounded bg-white text-black" 
                placeholder="Phone/Email"
              />
            </div>
          </div>
          <div>
            <label className="block text-black text-sm font-semibold mb-1">Description</label>
            <textarea 
              value={companyDescription} 
              onChange={e=>setCompanyDescription(e.target.value)} 
              className="w-full p-2 border-2 border-black rounded bg-white text-black" 
              placeholder="Company description"
              rows="2"
            />
          </div>
          
          <div>
            <label className="block text-black text-sm font-semibold mb-1">Company Logo (Optional)</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleLogoChange}
              className="w-full p-2 border-2 border-black rounded bg-white text-black text-sm"
            />
            {logoPreview && (
              <div className="mt-2">
                <img 
                  src={logoPreview} 
                  alt="Logo preview" 
                  className="w-32 h-32 object-contain rounded border-2 border-black bg-white p-2"
                />
              </div>
            )}
          </div>
          
          <div className="border-t-2 border-black pt-3 mt-4">
            <h4 className="font-semibold text-black mb-3">Company User Account</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-black text-sm font-semibold mb-1">First Name *</label>
                <input 
                  value={userFirstName} 
                  onChange={e=>setUserFirstName(e.target.value)} 
                  className="w-full p-2 border-2 border-black rounded bg-white text-black" 
                  required
                />
              </div>
              <div>
                <label className="block text-black text-sm font-semibold mb-1">Last Name *</label>
                <input 
                  value={userLastName} 
                  onChange={e=>setUserLastName(e.target.value)} 
                  className="w-full p-2 border-2 border-black rounded bg-white text-black" 
                  required
                />
              </div>
              <div>
                <label className="block text-black text-sm font-semibold mb-1">Email *</label>
                <input 
                  type="email"
                  value={userEmail} 
                  onChange={e=>setUserEmail(e.target.value)} 
                  className="w-full p-2 border-2 border-black rounded bg-white text-black" 
                  required
                />
              </div>
              <div>
                <label className="block text-black text-sm font-semibold mb-1">Phone</label>
                <input 
                  value={userPhone} 
                  onChange={e=>setUserPhone(e.target.value)} 
                  className="w-full p-2 border-2 border-black rounded bg-white text-black" 
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-black text-sm font-semibold mb-1">Password *</label>
                <input 
                  type="password"
                  value={userPassword} 
                  onChange={e=>setUserPassword(e.target.value)} 
                  className="w-full p-2 border-2 border-black rounded bg-white text-black" 
                  required
                />
              </div>
        </div>
      </div>

          <button 
            type="submit"
            className="w-full bg-black text-yellow-400 px-4 py-2 rounded font-semibold hover:bg-gray-800 mt-4"
          >
            Register Company
          </button>
        </form>
        </div>
      )}

      {/* Password Reset Tab */}
      {activeTab === 'password-reset' && (
        <div className="space-y-6">
          <div className="bg-yellow-600 p-6 rounded shadow">
            <h3 className="font-semibold mb-4 text-black text-lg">Reset Company User Password</h3>
            <form onSubmit={resetPassword} className="space-y-3">
              <div>
                <label className="block text-black text-sm font-semibold mb-1">Select Company</label>
                <select
                  value={resetCompanyId}
                  onChange={e => {
                    setResetCompanyId(e.target.value);
                    const company = companies.find(c => c._id === e.target.value);
                    if (company) {
                      selectCompanyForReset(company);
                    }
                  }}
                  className="w-full p-2 border-2 border-black rounded bg-white text-black"
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
                <label className="block text-black text-sm font-semibold mb-1">Company User Email *</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  className="w-full p-2 border-2 border-black rounded bg-white text-black"
                  placeholder="user@company.com"
                  required
                />
              </div>
              <div>
                <label className="block text-black text-sm font-semibold mb-1">New Password *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full p-2 border-2 border-black rounded bg-white text-black"
                  placeholder="Enter new password"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-black text-yellow-400 px-4 py-2 rounded font-semibold hover:bg-gray-800"
              >
                Reset Password
              </button>
            </form>
          </div>

          {/* Company Users List */}
          <div className="bg-yellow-600 p-6 rounded shadow">
            <h3 className="font-semibold mb-4 text-black text-lg">Company Users</h3>
            <div className="space-y-2">
              {companies.map(company => {
                // Get user from company object or find in companyUsers list
                const companyUser = company.user || companyUsers.find(u => {
                  const userId = typeof company.user === 'object' ? company.user?._id : company.user;
                  return u._id === userId;
                });
                
                return (
                  <div key={company._id} className="bg-white p-3 rounded flex justify-between items-center">
                    <div className="text-black">
                      <div className="font-semibold">{company.name}</div>
                      {companyUser && (
                        <div className="text-sm text-gray-600">
                          User: {companyUser.email || 'N/A'} ({companyUser.name || 'N/A'})
                        </div>
                      )}
                      {!companyUser && (
                        <div className="text-sm text-red-600">No user assigned</div>
                      )}
                    </div>
                    {companyUser && (
                      <button
                        onClick={() => {
                          selectCompanyForReset(company);
                          setActiveTab('password-reset');
                        }}
                        className="bg-yellow-400 text-black px-3 py-1 rounded text-sm font-semibold hover:bg-yellow-500"
                      >
                        Reset Password
                      </button>
                    )}
                  </div>
                );
              })}
              {companies.length === 0 && <div className="text-gray-700">No companies yet.</div>}
            </div>
        </div>
      </div>
      )}
    </div>
  )
}
