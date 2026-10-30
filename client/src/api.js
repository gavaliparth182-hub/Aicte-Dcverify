import axios from 'axios';

const http = axios.create({ baseURL: '/api' });
const data = (p) => p.then((r) => r.data);

export const api = {
  config: () => data(http.get('/config')),
  applications: () => data(http.get('/applications')),
  createApplication: (formData) => data(http.post('/applications', formData)),
  editField: (appId, index, field, value) => data(http.patch(`/applications/${appId}/documents/${index}`, { field, value })),
  setFlag: (appId, key, status) => data(http.patch(`/applications/${appId}/flags`, { key, status })),
  saveReview: (appId, body) => data(http.put(`/applications/${appId}/review`, body)),
  inspect: (file) => {
    const fd = new FormData();
    fd.append('lastModified', file.lastModified);
    fd.append('file', file);
    return data(http.post('/inspect', fd));
  },
};

export const errText = (e) => e?.response?.data?.error || e?.message || 'Something went wrong';
