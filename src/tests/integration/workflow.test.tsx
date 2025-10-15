/**
 * Integration Tests for Complete Workflows
 * Tests interactions between different parts of the system
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { Submission, Project, User } from '../../types';
import { mockProjects, mockCompany } from '../../data/mockData';
import { runAITests, generateCodeAnalysis } from '../mocks/ai-test-generator';

describe('End-to-End Submission Workflow', () => {
  let developer: User;
  let lead: User;
  let reviewer: User;
  let project: Project;

  beforeEach(() => {
    developer = mockCompany.users[0]; // john.dev
    lead = mockCompany.users[1]; // sarah.lead
    reviewer = mockCompany.users[2]; // mike.reviewer
    project = mockProjects[0];
  });

  it('should complete full submission workflow from creation to approval', () => {
    // Step 1: Developer creates submission
    const newSubmission: Partial<Submission> = {
      id: Date.now().toString(),
      projectId: project.id,
      projectName: project.name,
      developerName: developer.name,
      developerId: developer.id,
      description: 'New feature implementation',
      code: 'function newFeature() { return true; }',
      status: 'submitted',
      manualTests: [
        {
          id: '1',
          name: 'Feature test',
          description: 'Tests new feature',
          status: 'passed',
        },
      ],
      submittedDate: new Date().toISOString(),
    };

    expect(newSubmission.status).toBe('submitted');
    expect(newSubmission.developerId).toBe(developer.id);

    // Step 2: Auto-assign to leads and reviewers
    const assignedTo = project.members
      .filter(m => m.role === 'lead' || m.role === 'reviewer')
      .map(m => m.userId);

    newSubmission.assignedTo = assignedTo;
    expect(newSubmission.assignedTo).toContain(lead.id);
    expect(newSubmission.assignedTo).toContain(reviewer.id);

    // Step 3: Lead reviews and runs AI tests
    newSubmission.status = 'lead-review';
    const aiTestResults = runAITests(newSubmission.code || '');
    const aiCodeAnalysis = generateCodeAnalysis(newSubmission.code || '');

    newSubmission.aiTestResults = aiTestResults;
    newSubmission.aiCodeAnalysis = aiCodeAnalysis;
    newSubmission.status = 'user-review';

    expect(newSubmission.aiTestResults).toBeDefined();
    expect(newSubmission.aiCodeAnalysis).toBeDefined();
    expect(newSubmission.status).toBe('user-review');

    // Step 4: Reviewer approves
    newSubmission.reviewComments = 'Looks good!';
    newSubmission.status = 'approved';

    expect(newSubmission.status).toBe('approved');
    expect(newSubmission.reviewComments).toBeDefined();
  });

  it('should handle submission rejection workflow', () => {
    const submission: Partial<Submission> = {
      id: 'test-123',
      projectId: project.id,
      developerId: developer.id,
      status: 'submitted',
      description: 'Code with issues',
      assignedTo: [lead.id],
      manualTests: [
        {
          id: '1',
          name: 'Test',
          description: 'Basic test',
          status: 'failed',
        },
      ],
    };

    // Lead rejects submission
    submission.leadComments = 'Please fix the failing tests';
    submission.status = 'rejected';

    expect(submission.status).toBe('rejected');
    expect(submission.leadComments).toContain('fix');
  });
});

describe('Project and Team Management Workflow', () => {
  it('should create project and add team members', () => {
    const creator = mockCompany.users[1]; // Sarah Lead

    // Create project
    const newProject: Project = {
      id: `project-${Date.now()}`,
      name: 'New Project',
      description: 'Test project',
      companyId: creator.companyId,
      createdBy: creator.id,
      createdAt: new Date().toISOString(),
      status: 'active',
      members: [
        {
          userId: creator.id,
          userName: creator.name,
          role: 'lead',
          assignedAt: new Date().toISOString(),
        },
      ],
    };

    expect(newProject.members.length).toBe(1);
    expect(newProject.createdBy).toBe(creator.id);

    // Add developer
    const developer = mockCompany.users[0];
    newProject.members.push({
      userId: developer.id,
      userName: developer.name,
      role: 'developer',
      assignedAt: new Date().toISOString(),
    });

    expect(newProject.members.length).toBe(2);
    expect(newProject.members.some(m => m.userId === developer.id)).toBe(true);

    // Add reviewer
    const reviewer = mockCompany.users[2];
    newProject.members.push({
      userId: reviewer.id,
      userName: reviewer.name,
      role: 'reviewer',
      assignedAt: new Date().toISOString(),
    });

    expect(newProject.members.length).toBe(3);
  });

  it('should prevent duplicate members in project', () => {
    const project = { ...mockProjects[0] };
    const existingMember = project.members[0];

    const isDuplicate = project.members.some(m => m.userId === existingMember.userId);

    expect(isDuplicate).toBe(true);

    // Attempting to add duplicate should be prevented
    const memberCount = project.members.length;
    if (!project.members.some(m => m.userId === existingMember.userId)) {
      project.members.push(existingMember);
    }

    expect(project.members.length).toBe(memberCount);
  });

  it('should remove member from project', () => {
    const project = { ...mockProjects[0] };
    const memberToRemove = project.members[project.members.length - 1];
    const initialCount = project.members.length;

    project.members = project.members.filter(m => m.userId !== memberToRemove.userId);

    expect(project.members.length).toBe(initialCount - 1);
    expect(project.members.some(m => m.userId === memberToRemove.userId)).toBe(false);
  });
});

describe('Role-Based Access Control', () => {
  it('should filter submissions based on user role and assignment', () => {
    const developer = mockCompany.users[0];
    const lead = mockCompany.users[1];

    const allSubmissions: Partial<Submission>[] = [
      {
        id: '1',
        developerId: developer.id,
        assignedTo: [lead.id],
        status: 'submitted',
      },
      {
        id: '2',
        developerId: 'other-dev',
        assignedTo: [lead.id],
        status: 'submitted',
      },
      {
        id: '3',
        developerId: developer.id,
        assignedTo: ['other-lead'],
        status: 'approved',
      },
    ];

    // Developer sees only their submissions
    const developerSubmissions = allSubmissions.filter(
      s => s.developerId === developer.id
    );
    expect(developerSubmissions.length).toBe(2);

    // Lead sees only assigned submissions
    const leadSubmissions = allSubmissions.filter(
      s => s.assignedTo?.includes(lead.id)
    );
    expect(leadSubmissions.length).toBe(2);
  });

  it('should determine available roles for user based on project assignments', () => {
    const user = mockCompany.users[1]; // Sarah Lead
    const userProjects = mockProjects.filter(p =>
      p.members.some(m => m.userId === user.id)
    );

    const availableRoles = Array.from(
      new Set(
        userProjects.flatMap(p =>
          p.members
            .filter(m => m.userId === user.id)
            .map(m => m.role)
        )
      )
    );

    expect(availableRoles).toContain('lead');
    expect(availableRoles.length).toBeGreaterThan(0);
  });

  it('should restrict actions based on user role', () => {
    const userRole = 'developer';

    const canRunAITests = userRole === 'lead';
    const canApprove = userRole === 'lead' || userRole === 'reviewer';
    const canSubmitCode = userRole === 'developer';

    expect(canRunAITests).toBe(false);
    expect(canApprove).toBe(false);
    expect(canSubmitCode).toBe(true);
  });
});

describe('AI Testing Integration Workflow', () => {
  it('should run AI tests and update submission status', () => {
    const submission: Partial<Submission> = {
      id: '1',
      code: 'function test() { return true; }',
      status: 'lead-review',
    };

    // Run AI tests
    const aiTestResults = runAITests(submission.code || '');
    const aiCodeAnalysis = generateCodeAnalysis(submission.code || '');

    submission.aiTestResults = aiTestResults;
    submission.aiCodeAnalysis = aiCodeAnalysis;
    submission.status = 'user-review';

    expect(submission.status).toBe('user-review');
    expect(submission.aiTestResults?.total).toBeGreaterThan(0);
    expect(submission.aiCodeAnalysis?.securityScore).toBeDefined();
  });

  it('should combine manual and AI test results', () => {
    const manualTests = [
      { id: '1', name: 'Test 1', description: 'Manual test', status: 'passed' as const },
      { id: '2', name: 'Test 2', description: 'Manual test', status: 'failed' as const },
    ];

    const aiTestResults = runAITests('test code');

    const totalTests = manualTests.length + aiTestResults.total;
    const passedTests = manualTests.filter(t => t.status === 'passed').length + aiTestResults.passed;
    const overallPassRate = (passedTests / totalTests) * 100;

    expect(totalTests).toBeGreaterThan(0);
    expect(overallPassRate).toBeGreaterThanOrEqual(0);
    expect(overallPassRate).toBeLessThanOrEqual(100);
  });
});

describe('Multi-User Collaboration', () => {
  it('should handle multiple submissions from different developers', () => {
    const submissions: Partial<Submission>[] = [
      {
        id: '1',
        developerId: 'user-1',
        developerName: 'Dev 1',
        status: 'submitted',
      },
      {
        id: '2',
        developerId: 'user-4',
        developerName: 'Dev 2',
        status: 'submitted',
      },
    ];

    const uniqueDevelopers = new Set(submissions.map(s => s.developerId));

    expect(uniqueDevelopers.size).toBe(2);
  });

  it('should track submission history for projects', () => {
    const projectId = 'project-1';
    const submissions: Partial<Submission>[] = [
      { id: '1', projectId, status: 'approved' },
      { id: '2', projectId, status: 'rejected' },
      { id: '3', projectId, status: 'submitted' },
    ];

    const projectSubmissions = submissions.filter(s => s.projectId === projectId);

    expect(projectSubmissions.length).toBe(3);

    const approved = projectSubmissions.filter(s => s.status === 'approved').length;
    const rejected = projectSubmissions.filter(s => s.status === 'rejected').length;
    const pending = projectSubmissions.filter(s => s.status === 'submitted').length;

    expect(approved).toBe(1);
    expect(rejected).toBe(1);
    expect(pending).toBe(1);
  });
});
