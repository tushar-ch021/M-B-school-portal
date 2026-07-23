import API from './api';

export const markStudentAttendanceBulk = async (data) => {
  const response = await API.post('/attendance/student/bulk', data);
  return response.data;
};

export const getClassAttendanceByDate = async (params) => {
  const response = await API.get('/attendance/student/class', { params });
  return response.data;
};

export const getStudentAttendanceHistory = async (studentId, params) => {
  const response = await API.get(`/attendance/student/${studentId}/history`, { params });
  return response.data;
};

export const markStaffAttendanceBulk = async (data) => {
  const response = await API.post('/attendance/staff/bulk', data);
  return response.data;
};

export const getStaffAttendanceByDate = async (params) => {
  const response = await API.get('/attendance/staff', { params });
  return response.data;
};

export const addStaffMember = async (staffData) => {
  const response = await API.post('/attendance/staff', staffData);
  return response.data;
};

export const getMonthWiseAttendance = async (params) => {
  const response = await API.get('/attendance/monthly', { params });
  return response.data;
};
