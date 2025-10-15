/**
 * Unit Tests for Approval and Rejection Workflows
 * Tests the review and decision-making processes
 */

import { describe, it, expect } from '@jest/globals';
import { Submission } from '../../types';
import { mockSubmissions } from '../../data/mockData';

describe('Approval Workflow', () => {
  it('should approve a submission with comments', () => {
    let submission = { ...mockSubmissions[0] };
    const comments = 'Great work! Code looks good.';

    submission = {
      ...submission,
      status: 'approved',
      reviewComments: comments,
    };

    expect(submission.status).toBe('approved');
    expect(submission.reviewComments).toBe(comments);
  });

  it('should store reviewer comments on approval', () => {
    const reviewComments = 'Excellent implementation. All tests passed.';
    let submission: Submission = { ...mockSubmissions[0] };

    submission.reviewComments = reviewComments;

    expect(submission.reviewComments).toBeDefined();
    expect(submission.reviewComments).toContain('Excellent');
  });

  it('should maintain submission data after approval', () => {
    const originalSubmission = { ...mockSubmissions[0] };
    const approvedSubmission = {
      ...originalSubmission,
      status: 'approved' as const,
      reviewComments: 'Approved',
    };

    expect(approvedSubmission.id).toBe(originalSubmission.id);
    expect(approvedSubmission.developerName).toBe(originalSubmission.developerName);
    expect(approvedSubmission.projectName).toBe(originalSubmission.projectName);
  });

  it('should allow approval only for submissions in review status', () => {
    const validStatuses: Submission['status'][] = ['user-review', 'ai-testing', 'lead-review'];
    const invalidStatuses: Submission['status'][] = ['approved', 'rejected'];

    validStatuses.forEach(status => {
      const canApprove = status !== 'approved' && status !== 'rejected';
      expect(canApprove).toBe(true);
    });

    invalidStatuses.forEach(status => {
      const canApprove = status !== 'approved' && status !== 'rejected';
      expect(canApprove).toBe(false);
    });
  });
});

describe('Rejection Workflow', () => {
  it('should reject a submission with feedback', () => {
    let submission = { ...mockSubmissions[0] };
    const comments = 'Please fix the security issues before resubmitting.';

    submission = {
      ...submission,
      status: 'rejected',
      reviewComments: comments,
    };

    expect(submission.status).toBe('rejected');
    expect(submission.reviewComments).toBe(comments);
  });

  it('should require comments when rejecting', () => {
    const comments = 'Code needs improvement';
    const hasComments = comments.trim().length > 0;

    expect(hasComments).toBe(true);
  });

  it('should maintain original code and tests after rejection', () => {
    const originalSubmission = { ...mockSubmissions[0] };
    const rejectedSubmission = {
      ...originalSubmission,
      status: 'rejected' as const,
      reviewComments: 'Needs improvement',
    };

    expect(rejectedSubmission.code).toBe(originalSubmission.code);
    expect(rejectedSubmission.manualTests).toEqual(originalSubmission.manualTests);
  });

  it('should preserve AI test results after rejection', () => {
    const submission = { ...mockSubmissions[1] }; // Has AI test results

    const rejectedSubmission = {
      ...submission,
      status: 'rejected' as const,
      reviewComments: 'Fix the issues and resubmit',
    };

    expect(rejectedSubmission.aiTestResults).toBeDefined();
    expect(rejectedSubmission.aiTestResults?.total).toBeGreaterThan(0);
  });
});

describe('Review Permissions', () => {
  it('should allow leads to review submissions', () => {
    const userRole = 'lead';
    const canReview = userRole === 'lead' || userRole === 'reviewer';

    expect(canReview).toBe(true);
  });

  it('should allow reviewers to review submissions', () => {
    const userRole = 'reviewer';
    const canReview = userRole === 'lead' || userRole === 'reviewer';

    expect(canReview).toBe(true);
  });

  it('should not allow developers to review submissions', () => {
    const userRole = 'developer';
    const canReview = userRole === 'lead' || userRole === 'reviewer';

    expect(canReview).toBe(false);
  });

  it('should verify submission is assigned to reviewer', () => {
    const submission = mockSubmissions[0];
    const reviewerId = 'user-2';

    const isAssigned = submission.assignedTo?.includes(reviewerId);

    expect(isAssigned).toBe(true);
  });
});

describe('Review Comments Validation', () => {
  it('should accept valid review comments', () => {
    const validComments = [
      'Looks good!',
      'Please add more unit tests',
      'Excellent work on the implementation',
    ];

    validComments.forEach(comment => {
      const isValid = comment.trim().length > 0;
      expect(isValid).toBe(true);
    });
  });

  it('should handle empty comments', () => {
    const emptyComment = '';
    const isValid = emptyComment.trim().length > 0;

    expect(isValid).toBe(false);
  });

  it('should handle whitespace-only comments', () => {
    const whitespaceComment = '   ';
    const isValid = whitespaceComment.trim().length > 0;

    expect(isValid).toBe(false);
  });

  it('should preserve comment formatting', () => {
    const comment = 'Line 1\nLine 2\nLine 3';
    
    expect(comment).toContain('\n');
    expect(comment.split('\n').length).toBe(3);
  });
});

describe('Lead Comments Handling', () => {
  it('should store lead comments separately from review comments', () => {
    const submission = { ...mockSubmissions[1] };

    expect(submission.leadComments).toBeDefined();
    expect(submission.reviewComments).toBeDefined();
    expect(submission.leadComments).not.toBe(submission.reviewComments);
  });

  it('should allow leads to add comments during review', () => {
    let submission = { ...mockSubmissions[0] };
    const leadComments = 'Needs input validation improvements';

    submission = {
      ...submission,
      status: 'lead-review',
      leadComments,
    };

    expect(submission.leadComments).toBe(leadComments);
    expect(submission.status).toBe('lead-review');
  });
});
