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
    api.get(`/submissions?user_id=${userId}&role=${role}`),
  create: async (submission: {
    projectId: string | number,
    description: string,
    code?: string,
    files?: any[],
    manual_tests?: any[],
    ai_test_results?: any,
    developer_id: number,
    developer_name: string,
  }) => {
    try {
      const response = await api.post('/submissions', {
        project_id: Number(submission.projectId),
        developer_id: submission.developer_id,
        description: submission.description,
        code: submission.code,
        files: submission.files,
        manual_tests: submission.manual_tests,
        ai_test_results: submission.ai_test_results
      });
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

export default api;