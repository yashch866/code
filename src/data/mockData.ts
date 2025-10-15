import { Submission, User, Project, Company } from '../types';

// Mock company data
export const mockCompany: Company = {
  id: 'company-1',
  name: 'Tech Solutions Inc.',
  users: [
    {
      id: 'user-1',
      username: 'john.dev',
      password: 'password123',
      name: 'John Developer',
      email: 'john@techsolutions.com',
      companyId: 'company-1',
    },
    {
      id: 'user-2',
      username: 'sarah.lead',
      password: 'password123',
      name: 'Sarah Lead',
      email: 'sarah@techsolutions.com',
      companyId: 'company-1',
    },
    {
      id: 'user-3',
      username: 'mike.reviewer',
      password: 'password123',
      name: 'Mike Reviewer',
      email: 'mike@techsolutions.com',
      companyId: 'company-1',
    },
    {
      id: 'user-4',
      username: 'alice.dev',
      password: 'password123',
      name: 'Alice Anderson',
      email: 'alice@techsolutions.com',
      companyId: 'company-1',
    },
    {
      id: 'user-5',
      username: 'bob.dev',
      password: 'password123',
      name: 'Bob Builder',
      email: 'bob@techsolutions.com',
      companyId: 'company-1',
    },
  ],
};

// Mock projects - demonstrating multi-role capabilities
export const mockProjects: Project[] = [
  {
    id: 'project-1',
    name: 'E-commerce Platform',
    description: 'Building a scalable e-commerce platform with React and Node.js',
    companyId: 'company-1',
    createdBy: 'user-2',
    createdAt: '2025-09-01T10:00:00Z',
    status: 'active',
    members: [
      {
        userId: 'user-2',
        userName: 'Sarah Lead',
        role: 'lead',
        assignedAt: '2025-09-01T10:00:00Z',
      },
      {
        userId: 'user-1',
        userName: 'John Developer',
        role: 'developer',
        assignedAt: '2025-09-01T10:30:00Z',
      },
      {
        userId: 'user-3',
        userName: 'Mike Reviewer',
        role: 'reviewer',
        assignedAt: '2025-09-01T11:00:00Z',
      },
    ],
  },
  {
    id: 'project-2',
    name: 'Mobile App Development',
    description: 'React Native mobile application for iOS and Android',
    companyId: 'company-1',
    createdBy: 'user-1',
    createdAt: '2025-09-15T14:00:00Z',
    status: 'active',
    members: [
      {
        userId: 'user-1',
        userName: 'John Developer',
        role: 'lead', // John is a lead here but developer in project-1
        assignedAt: '2025-09-15T14:00:00Z',
      },
      {
        userId: 'user-4',
        userName: 'Alice Anderson',
        role: 'developer',
        assignedAt: '2025-09-15T14:30:00Z',
      },
      {
        userId: 'user-2',
        userName: 'Sarah Lead',
        role: 'reviewer', // Sarah is reviewer here but lead in project-1
        assignedAt: '2025-09-15T15:00:00Z',
      },
    ],
  },
  {
    id: 'project-3',
    name: 'API Gateway Service',
    description: 'Microservices API gateway with authentication and rate limiting',
    companyId: 'company-1',
    createdBy: 'user-3',
    createdAt: '2025-09-20T09:00:00Z',
    status: 'active',
    members: [
      {
        userId: 'user-3',
        userName: 'Mike Reviewer',
        role: 'lead', // Mike is lead here but reviewer in project-1
        assignedAt: '2025-09-20T09:00:00Z',
      },
      {
        userId: 'user-1',
        userName: 'John Developer',
        role: 'reviewer', // John is reviewer here, developer in project-1, lead in project-2
        assignedAt: '2025-09-20T09:30:00Z',
      },
      {
        userId: 'user-5',
        userName: 'Bob Builder',
        role: 'developer',
        assignedAt: '2025-09-20T10:00:00Z',
      },
    ],
  },
];

// Mock submissions with project assignments
export const mockSubmissions: Submission[] = [
  {
    id: '1',
    projectId: 'project-1',
    projectName: 'E-commerce Platform',
    developerName: 'John Developer',
    developerId: 'user-1',
    assignedTo: ['user-2', 'user-3'], // Assigned to lead and reviewer
    submittedDate: '2025-10-01T09:00:00Z',
    status: 'submitted',
    description: 'Implemented user authentication with JWT tokens and secure password hashing',
    code: `function authenticateUser(username, password) {
  const user = findUserByUsername(username);
  if (!user) return null;
  
  const isValidPassword = bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) return null;
  
  const token = jwt.sign({ userId: user.id }, JWT_SECRET);
  return { user, token };
}`,
    manualTests: [
      {
        id: 't1',
        name: 'Login with valid credentials',
        description: 'User can log in with correct username and password',
        status: 'passed',
      },
      {
        id: 't2',
        name: 'Login with invalid credentials',
        description: 'System rejects invalid login attempts',
        status: 'passed',
      },
      {
        id: 't3',
        name: 'JWT token generation',
        description: 'Valid JWT token is generated upon successful login',
        status: 'passed',
      },
    ],
  },
  {
    id: '2',
    projectId: 'project-1',
    projectName: 'E-commerce Platform',
    developerName: 'John Developer',
    developerId: 'user-1',
    assignedTo: ['user-2', 'user-3'],
    submittedDate: '2025-10-03T14:30:00Z',
    status: 'submitted',
    description: 'Shopping cart functionality with add, remove, and update quantity features',
    code: `class ShoppingCart {
  constructor() {
    this.items = [];
  }
  
  addItem(product, quantity = 1) {
    const existingItem = this.items.find(item => item.id === product.id);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.push({ ...product, quantity });
    }
  }
  
  removeItem(productId) {
    this.items = this.items.filter(item => item.id !== productId);
  }
  
  updateQuantity(productId, quantity) {
    const item = this.items.find(item => item.id === productId);
    if (item) {
      item.quantity = quantity;
    }
  }
  
  getTotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }
}`,
    manualTests: [
      {
        id: 't4',
        name: 'Add items to cart',
        description: 'Items can be successfully added to the shopping cart',
        status: 'passed',
      },
      {
        id: 't5',
        name: 'Update item quantity',
        description: 'Quantity of items in cart can be updated',
        status: 'passed',
      },
      {
        id: 't6',
        name: 'Calculate cart total',
        description: 'Cart total is calculated correctly',
        status: 'failed',
      },
    ],
    aiTestResults: {
      total: 10,
      passed: 8,
      failed: 2,
      coverage: 85,
      issues: [
        'Consider adding input validation for negative quantities',
        'Missing null checks in updateQuantity method',
      ],
      tests: [
        {
          testName: 'Unit: Add item to empty cart',
          status: 'passed',
          duration: 45,
        },
        {
          testName: 'Unit: Add duplicate item increases quantity',
          status: 'passed',
          duration: 52,
        },
        {
          testName: 'Unit: Remove item from cart',
          status: 'passed',
          duration: 38,
        },
        {
          testName: 'Unit: Update quantity',
          status: 'passed',
          duration: 41,
        },
        {
          testName: 'Unit: Calculate total price',
          status: 'failed',
          duration: 67,
        },
        {
          testName: 'Integration: Cart persistence',
          status: 'passed',
          duration: 234,
        },
        {
          testName: 'Security: Prevent negative quantities',
          status: 'failed',
          duration: 89,
        },
        {
          testName: 'Performance: Handle large carts',
          status: 'passed',
          duration: 456,
        },
        {
          testName: 'Edge Case: Empty cart operations',
          status: 'passed',
          duration: 33,
        },
        {
          testName: 'Edge Case: Maximum quantity limits',
          status: 'passed',
          duration: 78,
        },
      ],
    },
    aiCodeAnalysis: {
      securityScore: 78,
      performanceScore: 88,
      maintainabilityScore: 82,
      suggestions: [
        'Add input validation for quantity parameters',
        'Consider using Map instead of Array for better lookup performance',
        'Add JSDoc comments for public methods',
      ],
      vulnerabilities: [
        'No validation for negative quantities',
      ],
      complexityMetrics: {
        cyclomaticComplexity: 6,
        linesOfCode: 45,
        cognitiveComplexity: 4,
        maintainabilityIndex: 72,
      },
    },
    leadComments: 'Good implementation overall. Please address the input validation issues before final approval.',
  },
  {
    id: '3',
    projectId: 'project-2',
    projectName: 'Mobile App Development',
    developerName: 'Alice Anderson',
    developerId: 'user-4',
    assignedTo: ['user-2'],
    submittedDate: '2025-10-05T11:15:00Z',
    status: 'approved',
    description: 'Push notification service integration for mobile app',
    code: `async function sendPushNotification(userId, title, message) {
  const userToken = await getUserPushToken(userId);
  if (!userToken) {
    throw new Error('User push token not found');
  }
  
  const notification = {
    to: userToken,
    title: title,
    body: message,
    data: { timestamp: Date.now() }
  };
  
  const response = await fetch('https://api.expo.dev/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(notification)
  });
  
  return response.json();
}`,
    manualTests: [
      {
        id: 't7',
        name: 'Send notification to valid user',
        description: 'Notification is successfully sent to user with valid token',
        status: 'passed',
      },
      {
        id: 't8',
        name: 'Handle missing push token',
        description: 'Error is thrown when user has no push token',
        status: 'passed',
      },
    ],
    aiTestResults: {
      total: 8,
      passed: 8,
      failed: 0,
      coverage: 92,
      issues: [],
      tests: [
        {
          testName: 'Unit: Send notification success',
          status: 'passed',
          duration: 123,
        },
        {
          testName: 'Unit: Handle missing token',
          status: 'passed',
          duration: 67,
        },
        {
          testName: 'Integration: API integration',
          status: 'passed',
          duration: 345,
        },
        {
          testName: 'Security: Token validation',
          status: 'passed',
          duration: 89,
        },
        {
          testName: 'Performance: Batch notifications',
          status: 'passed',
          duration: 567,
        },
        {
          testName: 'Edge Case: Network failure',
          status: 'passed',
          duration: 234,
        },
        {
          testName: 'Edge Case: Invalid user ID',
          status: 'passed',
          duration: 45,
        },
        {
          testName: 'Edge Case: Empty message',
          status: 'passed',
          duration: 38,
        },
      ],
    },
    aiCodeAnalysis: {
      securityScore: 90,
      performanceScore: 85,
      maintainabilityScore: 88,
      suggestions: [
        'Consider adding retry logic for failed notifications',
        'Add rate limiting to prevent notification spam',
      ],
      vulnerabilities: [],
      complexityMetrics: {
        cyclomaticComplexity: 3,
        linesOfCode: 28,
        cognitiveComplexity: 2,
        maintainabilityIndex: 85,
      },
    },
    leadComments: 'Excellent work! Clean code and comprehensive testing.',
    reviewComments: 'Approved. Ready for production deployment.',
  },
  {
    id: '4',
    projectId: 'project-3',
    projectName: 'API Gateway Service',
    developerName: 'Bob Builder',
    developerId: 'user-5',
    assignedTo: ['user-3', 'user-1'],
    submittedDate: '2025-10-07T16:20:00Z',
    status: 'submitted',
    description: 'Rate limiting middleware for API endpoints with Redis caching',
    code: `function rateLimitMiddleware(req, res, next) {
  const clientId = req.ip;
  const key = \`rate_limit:\${clientId}\`;
  
  redis.get(key, (err, count) => {
    if (err) {
      return res.status(500).json({ error: 'Rate limit check failed' });
    }
    
    const limit = 100; // requests per minute
    const current = parseInt(count || '0');
    
    if (current >= limit) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    
    redis.incr(key);
    redis.expire(key, 60); // 1 minute TTL
    next();
  });
}`,
    manualTests: [
      {
        id: 't9',
        name: 'Rate limit enforcement',
        description: 'System blocks requests after limit is reached',
        status: 'passed',
      },
      {
        id: 't10',
        name: 'Rate limit reset',
        description: 'Rate limit counter resets after expiry time',
        status: 'passed',
      },
      {
        id: 't11',
        name: 'Multiple clients isolation',
        description: 'Rate limits are tracked separately for different clients',
        status: 'passed',
      },
    ],
    aiTestResults: {
      total: 12,
      passed: 11,
      failed: 1,
      coverage: 88,
      issues: [
        'Missing error handling for Redis connection failures',
        'Consider adding retry logic for transient errors',
      ],
      tests: [
        {
          testName: 'Unit: Rate limit counter increment',
          status: 'passed',
          duration: 32,
        },
        {
          testName: 'Unit: TTL expiration',
          status: 'passed',
          duration: 45,
        },
        {
          testName: 'Integration: Redis connection',
          status: 'passed',
          duration: 123,
        },
        {
          testName: 'Integration: Concurrent requests',
          status: 'passed',
          duration: 234,
        },
        {
          testName: 'Security: IP spoofing protection',
          status: 'passed',
          duration: 78,
        },
        {
          testName: 'Security: Rate limit bypass attempts',
          status: 'failed',
          duration: 156,
        },
        {
          testName: 'Performance: High traffic handling',
          status: 'passed',
          duration: 567,
        },
        {
          testName: 'Performance: Memory usage',
          status: 'passed',
          duration: 345,
        },
        {
          testName: 'Edge Case: Redis unavailable',
          status: 'passed',
          duration: 89,
        },
        {
          testName: 'Edge Case: Negative counter values',
          status: 'passed',
          duration: 41,
        },
        {
          testName: 'Edge Case: Maximum concurrent users',
          status: 'passed',
          duration: 678,
        },
        {
          testName: 'Edge Case: Zero limit configuration',
          status: 'passed',
          duration: 23,
        },
      ],
    },
    aiCodeAnalysis: {
      securityScore: 82,
      performanceScore: 91,
      maintainabilityScore: 85,
      suggestions: [
        'Add comprehensive error handling for Redis failures',
        'Implement circuit breaker pattern for Redis connection',
        'Consider using async/await instead of callbacks',
        'Add configuration for different rate limits per endpoint',
      ],
      vulnerabilities: [
        'Potential denial of service if Redis is down',
      ],
      complexityMetrics: {
        cyclomaticComplexity: 5,
        linesOfCode: 22,
        cognitiveComplexity: 3,
        maintainabilityIndex: 78,
      },
    },
  },
];
