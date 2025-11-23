import axios from 'axios';
const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const api = axios.create({ baseURL: base });
api.interceptors.request.use((req)=> {
  const t = localStorage.getItem('kelale_token');
  if(t) req.headers.Authorization = 'Bearer '+t;
  return req;
});
export default api;
