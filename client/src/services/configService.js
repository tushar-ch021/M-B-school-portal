import API from './api';

export const getBrandingConfig = async () => {
  const response = await API.get('/config/branding');
  return response.data;
};
