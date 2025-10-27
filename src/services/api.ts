import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000'; // Remove /api since it's already included in the backend routes

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authApi = {
  login: async (username: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', {
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
  register: (userData) => api.post('/api/auth/register', userData)
};

export const projectsApi = {
  getAll: async () => {
    try {
      const response = await api.get('/api/projects');
      return response;
    } catch (error) {
      console.error('Error fetching projects:', error);
      // Retry once on failure
      try {
        const retryResponse = await api.get('/api/projects');
        return retryResponse;
      } catch (retryError) {
        console.error('Retry failed:', retryError);
        throw retryError;
      }
    }
  },
  getByUser: async (userId: number) => {
    try {
      const response = await api.get(`/api/projects?user_id=${userId}`);
      return response;
    } catch (error) {
      console.error('Error fetching user projects:', error);
      // Retry once on failure
      try {
        const retryResponse = await api.get(`/api/projects?user_id=${userId}`);
        return retryResponse;
      } catch (retryError) {
        console.error('Retry failed:', retryError);
        throw retryError;
      }
    }
  },
  create: async (projectData: any) => {
    try {
      console.log('Creating project with data:', projectData);
      const response = await api.post('/api/projects', {
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
    api.post('/api/projects/members', { project_id: projectId, user_id: userId, role }),
  removeMember: (projectId: number, userId: number) => 
    api.delete(`/api/projects/${projectId}/members/${userId}`),
  deleteProject: (projectId: number) =>
    api.delete(`/api/projects/${projectId}`)
};

export const submissionsApi = {
  getAll: () => api.get('/api/submissions'),
  getByUser: (userId: number, role: string) => 
    api.get(`/api/submissions`, { params: { user_id: userId, role: role } }),
  create: async (submission: {
    project_id: string | number;
    developer_id: string | number;
    code: string;
    description: string;
    manual_tests?: Array<{
      name: string;
      description: string;
      status: string;
    }>;
  }) => {
    try {
      // Ensure IDs are sent as numbers
      const submissionData = {
        ...submission,
        project_id: Number(submission.project_id),
        developer_id: Number(submission.developer_id)
      };
      const response = await api.post('/api/submissions', submissionData);
      return response;
    } catch (error) {
      console.error('Error creating submission:', error);
      throw error;
    }
  }
};

export const usersApi = {
  getAll: () => api.get('/api/users'),
  getRecentInteractions: (userId: number) => api.get(`/api/users/recent?user_id=${userId}`)
};

export const manualTestsApi = {
  create: (testData: {
    submission_id: string;
    name: string;
    status: string;
    description: string;
  }) => api.post('/api/manual-tests', testData),
  getBySubmission: (submissionId: number) => 
    api.get(`/api/submissions/${submissionId}/manual-tests`)
};

export const aiTestsApi = {
  create: (testData: {
    submission_id: string | number;
    test_name: string;
    test_code: string;
    expected_output: string;
    actual_output: string;
    status: string;
    error_message?: string;
  }) => {
    // Ensure submission_id is sent as number
    const data = {
      ...testData,
      submission_id: Number(testData.submission_id)
    };
    return api.post('/api/ai-test-results', data);
  },
  getBySubmission: (submissionId: number) => 
    api.get(`/api/submissions/${submissionId}/ai-test-results`)
};

export default api;