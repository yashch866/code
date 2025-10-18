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
    try {
      const response = await api.post('/auth/login', {
        username,
        password
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
  getByUser: (userId: number) => api.get(`/projects?user_id=${userId}`),
  create: async (projectData: any) => {
    try {
      console.log('Creating project with data:', projectData);
      const response = await api.post('/projects', {
        name: projectData.name,
        description: projectData.description || '',
        creator_id: projectData.creator_id
      });
      console.log('Project creation response:', response.data);
      return response;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },
  addMember: (projectId: number, userId: number, role: string) => 
    api.post('/projects/members', { project_id: projectId, user_id: userId, role }),
  removeMember: (projectId: number, userId: number) => 
    api.delete(`/projects/${projectId}/members/${userId}`),
  deleteProject: (projectId: number) =>
    api.delete(`/projects/${projectId}`)
};

export const submissionsApi = {
  getAll: () => api.get('/submissions'),
  getByUser: (userId: number, role: string) => 
    api.get(`/submissions`, { params: { user_id: userId, role: role } }),
  create: async (submission: {
    project_id: string;
    developer_id: string;
    code: string;
    description: string;
    manual_tests?: Array<{
      name: string;
      description: string;
      status: string;
    }>;
  }) => {
    try {
      const response = await api.post('/submissions', submission);
      return response;
    } catch (error) {
      console.error('Error creating submission:', error);
      throw error;
    }
  }
};

export const usersApi = {
  getAll: () => api.get('/users'),
  getRecentInteractions: (userId: number) => api.get(`/users/recent?user_id=${userId}`)
};

export const manualTestsApi = {
  create: (testData: {
    submission_id: string;
    name: string;
    status: string;
    description: string;
  }) => api.post('/manual-tests', testData),
  getBySubmission: (submissionId: number) => 
    api.get(`/submissions/${submissionId}/manual-tests`)
};

export default api;