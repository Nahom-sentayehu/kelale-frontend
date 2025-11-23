import axios from 'axios';
const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const api = axios.create({ baseURL: base });
export default api;
