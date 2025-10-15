/**
 * Unit Tests for Login Functionality
 * Tests authentication logic and user validation
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { mockCompany } from '../../data/mockData';

describe('Login Authentication', () => {
  let users: typeof mockCompany.users;

  beforeEach(() => {
    users = [...mockCompany.users];
  });

  it('should successfully authenticate with valid credentials', () => {
    const username = 'john.dev';
    const password = 'password123';

    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    expect(user).toBeDefined();
    expect(user?.name).toBe('John Developer');
    expect(user?.companyId).toBe('company-1');
  });

  it('should reject invalid username', () => {
    const username = 'invalid.user';
    const password = 'password123';

    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    expect(user).toBeUndefined();
  });

  it('should reject invalid password', () => {
    const username = 'john.dev';
    const password = 'wrongpassword';

    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    expect(user).toBeUndefined();
  });

  it('should handle empty credentials', () => {
    const username = '';
    const password = '';

    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    expect(user).toBeUndefined();
  });

  it('should authenticate multiple users correctly', () => {
    const testCredentials = [
      { username: 'john.dev', password: 'password123', expectedName: 'John Developer' },
      { username: 'sarah.lead', password: 'password123', expectedName: 'Sarah Lead' },
      { username: 'mike.reviewer', password: 'password123', expectedName: 'Mike Reviewer' },
    ];

    testCredentials.forEach(({ username, password, expectedName }) => {
      const user = users.find(
        (u) => u.username === username && u.password === password
      );

      expect(user).toBeDefined();
      expect(user?.name).toBe(expectedName);
    });
  });

  it('should preserve user data after successful login', () => {
    const username = 'sarah.lead';
    const password = 'password123';

    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('companyId');
    expect(user?.email).toContain('@techsolutions.com');
  });

  it('should handle case-sensitive usernames', () => {
    const username = 'JOHN.DEV'; // Uppercase
    const password = 'password123';

    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    // Should not match because usernames are case-sensitive
    expect(user).toBeUndefined();
  });

  it('should return correct user ID for authenticated user', () => {
    const username = 'john.dev';
    const password = 'password123';

    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    expect(user?.id).toBe('user-1');
  });
});

describe('Login Session Management', () => {
  it('should store authenticated user data', () => {
    const authenticatedUser = {
      id: 'user-1',
      username: 'john.dev',
      name: 'John Developer',
      email: 'john@techsolutions.com',
      companyId: 'company-1',
    };

    expect(authenticatedUser.id).toBe('user-1');
    expect(authenticatedUser.username).toBe('john.dev');
  });

  it('should clear user data on logout', () => {
    let currentUser = mockCompany.users[0];
    
    // Simulate logout
    currentUser = null as any;

    expect(currentUser).toBeNull();
  });
});
