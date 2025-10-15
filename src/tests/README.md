# CodeReview Pro - Test Suite

This directory contains comprehensive tests for the CodeReview Pro application.

## Test Structure

### Unit Tests (`/tests/unit/`)
Unit tests verify individual functions and components in isolation.

- **login.test.tsx** - Tests authentication and role selection
- **submission.test.tsx** - Tests code submission creation and validation
- **approval.test.tsx** - Tests approval and rejection workflows
- **ai-test-execution.test.tsx** - Tests AI test generation and execution

### Integration Tests (`/tests/integration/`)
Integration tests verify that different parts of the system work together correctly.

- **workflow.test.tsx** - Tests complete submission workflows

### E2E Tests (`/tests/e2e/`)
End-to-end tests verify complete user journeys through the application.

- **complete-flow.test.tsx** - Tests entire application flows for all user roles

### Mocks (`/tests/mocks/`)
Mock implementations for testing purposes.

- **ai-test-generator.ts** - Simulates AI-generated test cases and code analysis

## Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm test -- tests/unit

# Run integration tests only
npm test -- tests/integration

# Run E2E tests only
npm test -- tests/e2e

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## Mock AI Test Generator

The mock AI test generator simulates the behavior of an AI system that:

1. Analyzes submitted code
2. Generates appropriate test cases
3. Executes tests and provides results
4. Performs code quality analysis

### Generated Test Categories

- **Unit Tests** - Test individual functions and components
- **Integration Tests** - Test API calls and database operations
- **Security Tests** - Verify input sanitization and authentication
- **Performance Tests** - Check handling of large datasets
- **Edge Cases** - Validate boundary conditions and error handling

### Code Analysis Metrics

- **Security Score** - Vulnerability assessment
- **Performance Score** - Efficiency evaluation
- **Maintainability Score** - Code quality metrics
- **Complexity Metrics** - Cyclomatic and cognitive complexity
- **Suggestions** - Improvement recommendations

## Test Coverage

The test suite covers:

- ✅ User authentication and login
- ✅ Role-based access control
- ✅ Code submission workflow
- ✅ Manual test management
- ✅ File attachment handling
- ✅ AI test generation and execution
- ✅ Code analysis and reporting
- ✅ Approval and rejection processes
- ✅ Status transitions
- ✅ Multi-role interactions
- ✅ State management
- ✅ Navigation flows
- ✅ Error handling
- ✅ Data persistence

## Writing New Tests

When adding new features, ensure you add corresponding tests:

1. **Unit tests** for individual functions
2. **Integration tests** for feature workflows
3. **E2E tests** for complete user journeys

Follow the existing test patterns and use descriptive test names.
