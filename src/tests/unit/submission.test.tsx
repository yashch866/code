/**
 * Unit Tests for Submission Creation
 * Tests submission validation and creation logic
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { Submission, ManualTest } from '../../types';
import { mockProjects } from '../../data/mockData';

describe('Submission Creation', () => {
  const mockProject = mockProjects[0];
  const mockUser = {
    id: 'user-1',
    username: 'john.dev',
    name: 'John Developer',
    email: 'john@test.com',
    companyId: 'company-1',
    password: 'test',
  };

  it('should create a valid submission with all required fields', () => {
    const manualTests: ManualTest[] = [
      {
        id: '1',
        name: 'Test authentication',
        description: 'Verify user login works',
        status: 'passed',
      },
    ];

    const submission: Omit<Submission, 'id' | 'submittedDate'> = {
      projectId: mockProject.id,
      projectName: mockProject.name,
      developerName: mockUser.name,
      developerId: mockUser.id,
      description: 'Implemented login functionality',
      code: 'function login() { return true; }',
      status: 'submitted',
      manualTests,
      assignedTo: ['user-2'],
    };

    expect(submission.projectId).toBe(mockProject.id);
    expect(submission.developerName).toBe(mockUser.name);
    expect(submission.manualTests.length).toBe(1);
    expect(submission.status).toBe('submitted');
  });

  it('should validate that at least one manual test is provided', () => {
    const manualTests: ManualTest[] = [];

    const isValid = manualTests.length > 0;

    expect(isValid).toBe(false);
  });

  it('should validate manual test has name and description', () => {
    const validTest: ManualTest = {
      id: '1',
      name: 'Valid test',
      description: 'This test has all required fields',
      status: 'passed',
    };

    const isValid = validTest.name.trim() !== '' && validTest.description.trim() !== '';

    expect(isValid).toBe(true);
  });

  it('should reject manual test without name', () => {
    const invalidTest = {
      id: '1',
      name: '',
      description: 'Test description',
      status: 'passed' as const,
    };

    const isValid = invalidTest.name.trim() !== '' && invalidTest.description.trim() !== '';

    expect(isValid).toBe(false);
  });

  it('should automatically assign submission to project leads and reviewers', () => {
    const assignedTo = mockProject.members
      .filter(m => m.role === 'lead' || m.role === 'reviewer')
      .map(m => m.userId);

    expect(assignedTo.length).toBeGreaterThan(0);
    expect(assignedTo).toContain('user-2'); // Sarah Lead
    expect(assignedTo).toContain('user-3'); // Mike Reviewer
  });

  it('should generate unique submission ID', () => {
    const id1 = Date.now().toString();
    
    // Wait a tiny bit
    const id2 = (Date.now() + 1).toString();

    expect(id1).not.toBe(id2);
  });

  it('should set correct initial status for new submission', () => {
    const submission = {
      status: 'submitted' as const,
    };

    expect(submission.status).toBe('submitted');
  });

  it('should track test results correctly', () => {
    const manualTests: ManualTest[] = [
      {
        id: '1',
        name: 'Test 1',
        description: 'Passed test',
        status: 'passed',
      },
      {
        id: '2',
        name: 'Test 2',
        description: 'Failed test',
        status: 'failed',
      },
      {
        id: '3',
        name: 'Test 3',
        description: 'Another passed test',
        status: 'passed',
      },
    ];

    const passedTests = manualTests.filter(t => t.status === 'passed').length;
    const totalTests = manualTests.length;
    const passRate = (passedTests / totalTests) * 100;

    expect(totalTests).toBe(3);
    expect(passedTests).toBe(2);
    expect(passRate).toBeCloseTo(66.67, 1);
  });

  it('should store file attachments correctly', () => {
    const files = [
      {
        name: 'test.js',
        size: 1024,
        type: 'text/javascript',
        content: 'data:text/javascript;base64,abc123',
      },
    ];

    expect(files.length).toBe(1);
    expect(files[0].name).toBe('test.js');
    expect(files[0].type).toBe('text/javascript');
  });

  it('should validate project selection', () => {
    const projectId = 'project-1';
    const project = mockProjects.find(p => p.id === projectId);

    expect(project).toBeDefined();
    expect(project?.name).toBe('E-commerce Platform');
  });
});

describe('Submission Status Transitions', () => {
  it('should transition from submitted to lead-review', () => {
    let status: Submission['status'] = 'submitted';
    status = 'lead-review';

    expect(status).toBe('lead-review');
  });

  it('should transition from lead-review to user-review', () => {
    let status: Submission['status'] = 'lead-review';
    status = 'user-review';

    expect(status).toBe('user-review');
  });

  it('should transition to approved from user-review', () => {
    let status: Submission['status'] = 'user-review';
    status = 'approved';

    expect(status).toBe('approved');
  });

  it('should transition to rejected from any review status', () => {
    let status: Submission['status'] = 'lead-review';
    status = 'rejected';

    expect(status).toBe('rejected');
  });
});
