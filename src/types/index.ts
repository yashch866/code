export type TestResult = {
  testName: string;
  status: 'passed' | 'failed';
  duration: number;
  description?: string;
};

export type ManualTest = {
  id: string;
  name: string;
  description: string;
  status: 'passed' | 'failed';
  executedAt?: string;
};

export type SubmissionStatus = 'submitted' | 'lead-review' | 'ai-testing' | 'user-review' | 'approved' | 'rejected';

export type FileAttachment = {
  name: string;
  size: number;
  type: string;
  content: string; // Base64 or data URL for demo
};

export type AICodeAnalysis = {
  securityScore: number;
  performanceScore: number;
  maintainabilityScore: number;
  suggestions: string[];
  vulnerabilities: string[];
  complexityMetrics: {
    cyclomaticComplexity: number;
    linesOfCode: number;
    cognitiveComplexity: number;
    maintainabilityIndex: number;
  };
};

export type UserRole = 'developer' | 'lead' | 'reviewer';

export type User = {
  id: number;  // Changed from string to number
  username: string;
  password: string;
  name: string;
  email: string;
  companyId?: string;  // Made optional since it's not used in current DB
};

export type ProjectMember = {
  userId: number;  // Changed from string to number
  userName: string;
  role: UserRole;
  assignedAt?: string;  // Made optional since it's not in current DB
};

export type Project = {
  id: number;  // Changed from string to number
  name: string;
  description: string;
  companyId?: string;  // Made optional since it's not in current DB
  createdBy: number;  // Changed from string to number
  createdAt?: string;  // Made optional since it's not in current DB
  members: ProjectMember[];
  status?: 'active' | 'completed' | 'archived';  // Made optional since it's not in current DB
};

export type Submission = {
  id: string;
  projectId: string;
  projectName: string;
  developerName: string;
  developerId: string;
  assignedTo?: string[]; // User IDs of assigned reviewers/leads
  submittedDate: string;
  status: SubmissionStatus;
  code?: string;
  description: string;
  files?: FileAttachment[];
  manualTests: ManualTest[];
  aiTestResults?: {
    total: number;
    passed: number;
    failed: number;
    coverage: number;
    issues: string[];
    tests: TestResult[];
  };
  aiCodeAnalysis?: AICodeAnalysis;
  leadComments?: string;
  reviewComments?: string;
};

export type Company = {
  id: string;
  name: string;
  users: User[];
};
