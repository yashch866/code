import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authApi = {
  login: async (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    try {
      const response = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      console.log('Server response:', response.data);
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  register: (userData) => api.post('/auth/register', userData)
};

export const projectsApi = {
  getAll: () => api.get('/projects'),
  getByUser: (userId: string) => api.get(`/projects?user_id=${userId}`),
  create: async (projectData: any) => {
    try {
      console.log('Creating project with data:', projectData);
      const response = await api.post('/projects', {
        name: projectData.name,
        description: projectData.description || ''
      });
      console.log('Project creation response:', response);
      return response;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }
};

export const submissionsApi = {
  getAll: () => api.get('/submissions'),
  create: (data: any) => api.post('/submissions', data)
};

export default api;