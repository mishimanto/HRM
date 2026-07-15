import api from './api';

export const attendanceService = {
  getAll: (params = {}) => api.get('/attendances', { params }),
  getById: (id) => api.get(`/attendances/${id}`),
  create: (data) => api.post('/attendances', data),
  update: (id, data) => api.put(`/attendances/${id}`, data),

  checkIn: (data) => api.post('/attendances/check-in', data),

  checkOut: (data) => api.post('/attendances/check-out', data),
  
  monthlyReport: (params) => api.get('/attendances/report/monthly', { params }),
  
  // Employee specific routes
  myAttendance: (params = {}) => api.get('/attendances/my-attendance', { params }),
  myCheckIn: (data) => api.post('/attendances/my-checkin', data),
  myCheckOut: (data) => api.post('/attendances/my-checkout', data),
  myMonthlyReport: (params) => api.get('/attendances/my-report/monthly', { params }),
};
