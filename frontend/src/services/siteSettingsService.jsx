import api from './api';

export const siteSettingsService = {
  get: () => api.get('/site-settings'),
  update: data => api.post('/site-settings', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};
