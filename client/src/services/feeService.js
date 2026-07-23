import api from './api';

const feeService = {
  collectFee: async (feeData) => {
    const response = await api.post('/fees/collect', feeData);
    return response.data;
  },

  getFeeHistory: async (studentId) => {
    const response = await api.get(`/fees/student/${studentId}`);
    return response.data;
  },

  getStudentFeeSummary: async (studentId) => {
    const response = await api.get(`/fees/student/${studentId}/summary`);
    return response.data;
  },

  updateStudentDues: async (studentId, duesData) => {
    const response = await api.put(`/fees/student/${studentId}/update-dues`, duesData);
    return response.data;
  },

  getDashboardStats: async (className = '', section = '') => {
    const response = await api.get('/fees/dashboard-stats', {
      params: { className, section }
    });
    return response.data;
  },

  setMonthlyFeeConfig: async (configData) => {
    const response = await api.post('/fees/monthly/config', configData);
    return response.data;
  },

  getMonthlyFeeConfig: async (params) => {
    const response = await api.get('/fees/monthly/config', { params });
    return response.data;
  },

  getStudentMonthlyFees: async (studentId, params) => {
    const response = await api.get(`/fees/monthly/student/${studentId}`, { params });
    return response.data;
  },

  getClassMonthlyFeeOverview: async (params) => {
    const response = await api.get('/fees/monthly/class', { params });
    return response.data;
  },

  collectMonthlyFeePayment: async (data) => {
    const response = await api.post('/fees/monthly/payment', data);
    return response.data;
  },

  setIndividualStudentMonthlyFee: async (data) => {
    const response = await api.put('/fees/monthly/student-fee', data);
    return response.data;
  }
};

export default feeService;
