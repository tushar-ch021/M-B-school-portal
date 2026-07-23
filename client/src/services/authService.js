import api from './api';

const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data && response.data.token) {
      localStorage.setItem('bris_admin_token', response.data.token);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('bris_admin_token');
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  uploadSignature: async (formData) => {
    const response = await api.put('/auth/signature', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  deleteSignature: async () => {
    const response = await api.delete('/auth/signature');
    return response.data;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('bris_admin_token');
  }
};

export default authService;
