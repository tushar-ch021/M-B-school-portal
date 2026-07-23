import API from './api';

export const createCertificate = async (data) => {
  const response = await API.post('/certificates', data);
  return response.data;
};

export const getCertificates = async (params) => {
  const response = await API.get('/certificates', { params });
  return response.data;
};

export const getCertificateById = async (id) => {
  const response = await API.get(`/certificates/${id}`);
  return response.data;
};

export const deleteCertificate = async (id) => {
  const response = await API.delete(`/certificates/${id}`);
  return response.data;
};
