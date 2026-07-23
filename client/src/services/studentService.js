import api from './api';

const studentService = {
  getStudents: async (filters = {}) => {
    const { className, section, search, page, limit } = filters;
    const params = {};
    if (className) params.className = className;
    if (section) params.section = section;
    if (search) params.search = search;
    if (page) params.page = page;
    if (limit) params.limit = limit;

    const response = await api.get('/students', { params });
    return response.data;
  },

  getStudentById: async (id) => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  admitStudent: async (studentData) => {
    const isFormData = studentData instanceof FormData;
    const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : {};
    
    const response = await api.post('/students', studentData, { headers });
    return response.data;
  },

  updateStudent: async (id, studentData) => {
    const isFormData = studentData instanceof FormData;
    const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : {};

    const response = await api.put(`/students/${id}`, studentData, { headers });
    return response.data;
  },

  deleteStudent: async (id) => {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },

  issueTC: async (studentId, tcData) => {
    const response = await api.post(`/tc/issue/${studentId}`, tcData);
    return response.data;
  },

  getTCRecords: async (search = '') => {
    const params = {};
    if (search) params.search = search;
    
    const response = await api.get('/tc/records', { params });
    return response.data;
  },

  getTCDetails: async (studentId) => {
    const response = await api.get(`/tc/${studentId}`);
    return response.data;
  },

  removeStudent: async (id, reason) => {
    const response = await api.put(`/students/${id}/remove`, { reason });
    return response.data;
  },

  getRemovedStudents: async (filters = {}) => {
    const { className, section, search, page, limit } = filters;
    const params = {};
    if (className) params.className = className;
    if (section) params.section = section;
    if (search) params.search = search;
    if (page) params.page = page;
    if (limit) params.limit = limit;

    const response = await api.get('/students/removed', { params });
    return response.data;
  },

  restoreStudent: async (id) => {
    const response = await api.put(`/students/${id}/restore`);
    return response.data;
  }
};

export default studentService;
