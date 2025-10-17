import axios from 'axios';

const instance = axios.create({
  BACKEND_URL: 'http://localhost:5000/api',
  withCredentials: true, 
});

export default instance;
