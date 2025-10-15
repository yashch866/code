/**
 * End-to-End Tests for Complete Application Flows
 * Tests entire user journeys through the application
 */

import { describe, it, expect } from '@jest/globals';
import { Submission, Project, User } from '../../types';
import { mockCompany, mockProjects } from '../../data/mockData';
import { runAITests, generateCodeAnalysis } from '../mocks/ai-test-generator';

describe('E2E: Complete Developer Journey', () => {
  it('should complete full developer workflow from login to submission', () => {
    // Step 1: Login as developer
    const username = 'john.dev';
    const password = 'password123';

    const developer = mockCompany.users.find(
      u => u.username === username && u.password === password
    );

    expect(developer).toBeDefined();
    expect(developer?.name).toBe('John Developer');

    // Step 2: Check assigned projects
    const developerProjects = mockProjects.filter(p =>
      p.members.some(m => m.userId === developer!.id && m.role === 'developer')
    );

    expect(developerProjects.length).toBeGreaterThan(0);

    // Step 3: Create submission
    const project = developerProjects[0];
    const manualTests = [
      {
        id: '1',
        name: 'Login functionality test',
        description: 'Verified login works with valid credentials',
        status: 'passed' as const,
      },
      {
        id: '2',
        name: 'Error handling test',
        description: 'Confirmed invalid credentials are rejected',
        status: 'passed' as const,
      },
    ];

    const submission: Submission = {
      id: Date.now().toString(),
      projectId: project.id,
      projectName: project.name,
      developerName: developer!.name,
      developerId: developer!.id,
      assignedTo: project.members
        .filter(m => m.role === 'lead' || m.role === 'reviewer')
        .map(m => m.userId),
      submittedDate: new Date().toISOString(),
      status: 'submitted',
      description: 'Implemented user authentication system',
      code: `
function authenticateUser(username, password) {
  const user = findUser(username);
  if (!user || !verifyPassword(password, user.hash)) {
    return null;
  }
  return generateToken(user);
}
      `,
      manualTests,
    };

    expect(submission.status).toBe('submitted');
    expect(submission.assignedTo!.length).toBeGreaterThan(0);

    // Step 4: View own submissions
    const allSubmissions = [submission];
    const mySubmissions = allSubmissions.filter(
      s => s.developerId === developer!.id
    );

    expect(mySubmissions.length).toBe(1);
    expect(mySubmissions[0].id).toBe(submission.id);

    // Step 5: Check submission status
    expect(submission.status).toBe('submitted');
  });

  it('should allow developer to switch roles if assigned multiple roles', () => {
    const developer = mockCompany.users[0];
    const userProjects = mockProjects.filter(p =>
      p.members.some(m => m.userId === developer.id)
    );

    const availableRoles = Array.from(
      new Set(
        userProjects.flatMap(p =>
          p.members
            .filter(m => m.userId === developer.id)
            .map(m => m.role)
        )
      )
    );

    expect(availableRoles).toContain('developer');

    // Switch to different role if available
    let currentRole = 'developer';
    if (availableRoles.length > 1) {
      currentRole = availableRoles.find(r => r !== 'developer') || 'developer';
    }

    expect(availableRoles).toContain(currentRole);
  });
});

describe('E2E: Complete Lead Workflow', () => {
  it('should complete full lead workflow from login to AI testing', () => {
    // Step 1: Login as lead
    const username = 'sarah.lead';
    const password = 'password123';

    const lead = mockCompany.users.find(
      u => u.username === username && u.password === password
    );

    expect(lead).toBeDefined();
    expect(lead?.name).toBe('Sarah Lead');

    // Step 2: Check assigned projects
    const leadProjects = mockProjects.filter(p =>
      p.members.some(m => m.userId === lead!.id && m.role === 'lead')
    );

    expect(leadProjects.length).toBeGreaterThan(0);

    // Step 3: Create a new project
    const newProject: Project = {
      id: `project-${Date.now()}`,
      name: 'API Refactoring Project',
      description: 'Modernize legacy API endpoints',
      companyId: lead!.companyId,
      createdBy: lead!.id,
      createdAt: new Date().toISOString(),
      status: 'active',
      members: [
        {
          userId: lead!.id,
          userName: lead!.name,
          role: 'lead',
          assignedAt: new Date().toISOString(),
        },
      ],
    };

    expect(newProject.createdBy).toBe(lead!.id);
    expect(newProject.members.some(m => m.role === 'lead')).toBe(true);

    // Step 4: Add team members
    const developer = mockCompany.users.find(u => u.username === 'alice.dev');
    const reviewer = mockCompany.users.find(u => u.username === 'mike.reviewer');

    if (developer) {
      newProject.members.push({
        userId: developer.id,
        userName: developer.name,
        role: 'developer',
        assignedAt: new Date().toISOString(),
      });
    }

    if (reviewer) {
      newProject.members.push({
        userId: reviewer.id,
        userName: reviewer.name,
        role: 'reviewer',
        assignedAt: new Date().toISOString(),
      });
    }

    expect(newProject.members.length).toBeGreaterThanOrEqual(2);

    // Step 5: Review incoming submission
    const incomingSubmission: Submission = {
      id: 'sub-123',
      projectId: leadProjects[0].id,
      projectName: leadProjects[0].name,
      developerName: 'John Developer',
      developerId: 'user-1',
      assignedTo: [lead!.id],
      submittedDate: new Date().toISOString(),
      status: 'submitted',
      description: 'New feature implementation',
      code: 'function newFeature() { return "hello"; }',
      manualTests: [
        {
          id: '1',
          name: 'Feature test',
          description: 'Tests the new feature',
          status: 'passed',
        },
      ],
    };

    // Step 6: Run AI tests
    const aiTestResults = runAITests(incomingSubmission.code!);
    const aiCodeAnalysis = generateCodeAnalysis(incomingSubmission.code!);

    incomingSubmission.aiTestResults = aiTestResults;
    incomingSubmission.aiCodeAnalysis = aiCodeAnalysis;
    incomingSubmission.status = 'user-review';

    expect(incomingSubmission.status).toBe('user-review');
    expect(incomingSubmission.aiTestResults).toBeDefined();
    expect(incomingSubmission.aiCodeAnalysis).toBeDefined();

    // Step 7: Add lead comments
    incomingSubmission.leadComments = 'Good work. Please review the AI suggestions.';

    expect(incomingSubmission.leadComments).toBeDefined();
  });
});

describe('E2E: Complete Reviewer Workflow', () => {
  it('should complete full reviewer workflow from login to approval', () => {
    // Step 1: Login as reviewer
    const username = 'mike.reviewer';
    const password = 'password123';

    const reviewer = mockCompany.users.find(
      u => u.username === username && u.password === password
    );

    expect(reviewer).toBeDefined();
    expect(reviewer?.name).toBe('Mike Reviewer');

    // Step 2: Check assigned submissions
    const reviewerProjects = mockProjects.filter(p =>
      p.members.some(m => m.userId === reviewer!.id && m.role === 'reviewer')
    );

    expect(reviewerProjects.length).toBeGreaterThan(0);

    // Step 3: Review submission ready for review
    const submission: Submission = {
      id: 'sub-456',
      projectId: reviewerProjects[0].id,
      projectName: reviewerProjects[0].name,
      developerName: 'John Developer',
      developerId: 'user-1',
      assignedTo: [reviewer!.id],
      submittedDate: new Date().toISOString(),
      status: 'user-review',
      description: 'Feature implementation',
      code: 'function calculate() { return 42; }',
      manualTests: [
        {
          id: '1',
          name: 'Calculation test',
          description: 'Verify calculation is correct',
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
            testName: 'Unit: Basic calculation',
            status: 'passed',
            duration: 45,
          },
        ],
      },
      aiCodeAnalysis: {
        securityScore: 95,
        performanceScore: 90,
        maintainabilityScore: 88,
        suggestions: ['Add JSDoc comments'],
        vulnerabilities: [],
        complexityMetrics: {
          cyclomaticComplexity: 2,
          linesOfCode: 15,
          cognitiveComplexity: 1,
          maintainabilityIndex: 85,
        },
      },
    };

    expect(submission.status).toBe('user-review');
    expect(submission.assignedTo).toContain(reviewer!.id);

    // Step 4: Review test results
    const passRate = (submission.aiTestResults!.passed / submission.aiTestResults!.total) * 100;
    expect(passRate).toBe(100);

    // Step 5: Approve submission
    submission.reviewComments = 'Excellent work! All tests passed and code quality is high.';
    submission.status = 'approved';

    expect(submission.status).toBe('approved');
    expect(submission.reviewComments).toContain('Excellent');
  });

  it('should allow reviewer to reject submission with feedback', () => {
    const reviewer = mockCompany.users.find(u => u.username === 'mike.reviewer');
    const submission: Partial<Submission> = {
      id: 'sub-789',
      status: 'user-review',
      assignedTo: [reviewer!.id],
      aiTestResults: {
        total: 10,
        passed: 6,
        failed: 4,
        coverage: 65,
        issues: ['Missing error handling', 'Security vulnerability found'],
        tests: [],
      },
    };

    // Reject due to failed tests and issues
    submission.reviewComments = 'Please address the 4 failed tests and security issues before resubmitting.';
    submission.status = 'rejected';

    expect(submission.status).toBe('rejected');
    expect(submission.reviewComments).toContain('security issues');
  });
});

describe('E2E: Multi-User Collaboration Scenario', () => {
  it('should handle complete multi-user project collaboration', () => {
    // Create new project
    const lead = mockCompany.users[1];
    const project: Project = {
      id: 'collab-project',
      name: 'Collaborative Project',
      description: 'Team collaboration test',
      companyId: lead.companyId,
      createdBy: lead.id,
      createdAt: new Date().toISOString(),
      status: 'active',
      members: [],
    };

    // Add all team members
    mockCompany.users.forEach((user, index) => {
      const role = index === 1 ? 'lead' : index === 2 ? 'reviewer' : 'developer';
      project.members.push({
        userId: user.id,
        userName: user.name,
        role: role as any,
        assignedAt: new Date().toISOString(),
      });
    });

    expect(project.members.length).toBe(mockCompany.users.length);

    // Multiple developers submit code
    const submissions: Submission[] = [];
    const developers = project.members.filter(m => m.role === 'developer');

    developers.forEach((dev, index) => {
      const sub: Submission = {
        id: `sub-${index}`,
        projectId: project.id,
        projectName: project.name,
        developerName: dev.userName,
        developerId: dev.userId,
        assignedTo: project.members
          .filter(m => m.role === 'lead' || m.role === 'reviewer')
          .map(m => m.userId),
        submittedDate: new Date(Date.now() + index * 1000).toISOString(),
        status: 'submitted',
        description: `Feature ${index + 1}`,
        code: `function feature${index}() { return ${index}; }`,
        manualTests: [
          {
            id: `t-${index}`,
            name: `Test ${index}`,
            description: `Testing feature ${index}`,
            status: 'passed',
          },
        ],
      };
      submissions.push(sub);
    });

    expect(submissions.length).toBe(developers.length);

    // Lead reviews all submissions
    submissions.forEach(sub => {
      sub.status = 'lead-review';
      sub.aiTestResults = runAITests(sub.code!);
      sub.aiCodeAnalysis = generateCodeAnalysis(sub.code!);
      sub.status = 'user-review';
      sub.leadComments = 'Reviewed and tested';
    });

    expect(submissions.every(s => s.status === 'user-review')).toBe(true);

    // Reviewer approves/rejects
    submissions.forEach((sub, index) => {
      if (index % 2 === 0) {
        sub.status = 'approved';
        sub.reviewComments = 'Approved';
      } else {
        sub.status = 'rejected';
        sub.reviewComments = 'Needs improvement';
      }
    });

    const approved = submissions.filter(s => s.status === 'approved').length;
    const rejected = submissions.filter(s => s.status === 'rejected').length;

    expect(approved + rejected).toBe(submissions.length);
  });
});

describe('E2E: Project Analytics and Reporting', () => {
  it('should generate project analytics across all submissions', () => {
    const projectId = 'project-1';
    const submissions: Submission[] = [
      {
        id: '1',
        projectId,
        projectName: 'Test Project',
        developerName: 'Dev 1',
        developerId: 'user-1',
        submittedDate: new Date().toISOString(),
        status: 'approved',
        description: 'Feature 1',
        manualTests: [],
      },
      {
        id: '2',
        projectId,
        projectName: 'Test Project',
        developerName: 'Dev 2',
        developerId: 'user-2',
        submittedDate: new Date().toISOString(),
        status: 'rejected',
        description: 'Feature 2',
        manualTests: [],
      },
      {
        id: '3',
        projectId,
        projectName: 'Test Project',
        developerName: 'Dev 1',
        developerId: 'user-1',
        submittedDate: new Date().toISOString(),
        status: 'submitted',
        description: 'Feature 3',
        manualTests: [],
      },
    ];

    const projectSubmissions = submissions.filter(s => s.projectId === projectId);

    const analytics = {
      total: projectSubmissions.length,
      approved: projectSubmissions.filter(s => s.status === 'approved').length,
      rejected: projectSubmissions.filter(s => s.status === 'rejected').length,
      pending: projectSubmissions.filter(s => s.status === 'submitted' || s.status === 'lead-review' || s.status === 'user-review').length,
      approvalRate: 0,
    };

    analytics.approvalRate = (analytics.approved / analytics.total) * 100;

    expect(analytics.total).toBe(3);
    expect(analytics.approved).toBe(1);
    expect(analytics.rejected).toBe(1);
    expect(analytics.pending).toBe(1);
    expect(analytics.approvalRate).toBeCloseTo(33.33, 1);
  });
});
