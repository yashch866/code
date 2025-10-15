# Multi-Role User System Guide

## Overview
CodeReview Pro now supports a flexible multi-role system where users can have different roles in different projects. A single user can be a developer in one project, a lead in another, and a reviewer in yet another project.

## 🆕 AI Testing Workflow Update
AI automated testing and code analysis is now run by **developers before submission**, not by project leads. This ensures higher quality submissions and allows developers to identify and fix issues early in the development process.

## Key Features

### 1. Sign Up / Registration
- New users can create accounts using the **Sign Up** tab on the login screen
- Required information:
  - Full Name
  - Email (validated)
  - Username (must be unique)
  - Password (minimum 6 characters)
- After signing up, users can immediately log in with their credentials

### 2. Multi-Role Capability
Users can have **different roles in different projects**:
- **Developer** in Project A
- **Lead** in Project B  
- **Reviewer** in Project C

This is demonstrated in the mock data where "John Developer":
- Is a Developer in "E-commerce Platform"
- Is a Lead in "Mobile App Development"
- Is a Reviewer in "API Gateway Service"

### 3. Role Switching
- The **Role Switcher** component shows all available roles for the current user
- Displays the number of projects for each role
- Users can easily switch between their roles to see different dashboards and tasks
- Only roles where the user has project assignments are enabled

### 4. Project Management & Role Assignment
Project leads have full control over role assignments:
- **Create New Projects**: Leads automatically become the project lead
- **Add Team Members**: Can assign any user as Developer, Reviewer, or Lead
- **Remove Members**: Can remove team members (except themselves)
- **Delete Projects**: Project creators can delete their projects

### 5. Task Assignment & Workflow
- Tasks (submissions) are automatically assigned to leads and reviewers in the project
- Users only see tasks from projects where they have the current selected role
- **Developer Dashboard**: 
  - Shows submissions where the user is the developer
  - Allows running AI automated tests before submission
  - Developers submit code with both manual AND AI test results
- **Lead Dashboard**: 
  - Shows submissions from projects where the user is a lead
  - Reviews both manual and AI test results submitted by developers
  - Can approve or request changes
- **Reviewer Dashboard**: 
  - Shows submissions from projects where the user is a reviewer
  - Final review and approval of submissions

## New Developer Workflow

### Submitting Code with AI Testing:
1. **Write your code** in the code editor
2. **Run AI Automated Tests** using the button at the top of the submission form
   - AI generates and executes comprehensive test cases
   - Provides code quality analysis (security, performance, maintainability)
   - Identifies potential issues and vulnerabilities
   - Calculates code coverage
3. **Add Manual Tests** that you've performed
4. **Review AI Results** and fix any issues identified
5. **Submit** your code with both manual and AI test results together
6. Project leads and reviewers can now see your complete test report

### Benefits of AI Testing Before Submission:
- **Early Issue Detection**: Find bugs before code review
- **Higher Quality**: Submit better tested code
- **Faster Reviews**: Leads see comprehensive test results immediately
- **Learning**: Understand code quality metrics and best practices
- **Confidence**: Know your code passes automated tests before submission

## How It Works

### For New Users:
1. Click the **Sign Up** tab on the login screen
2. Fill in all required fields
3. Create your account
4. Log in with your new credentials
5. Wait for a project lead to add you to projects

### For Project Leads:
1. Navigate to **Manage Projects** from the top menu
2. Click **New Project** to create a project (you become the lead automatically)
3. Add team members by:
   - Selecting a user from the dropdown
   - Choosing their role (Developer, Reviewer, or Lead)
   - Clicking **Add**
4. The same user can be added to multiple projects with different roles

### For Multi-Role Users:
1. Use the **Role Switcher** at the top of your dashboard
2. See how many projects you have for each role
3. Switch between roles to see different tasks and responsibilities
4. Each role has its own dashboard with relevant tasks

## Example Scenarios

### Scenario 1: John's Multi-Role Journey
- **E-commerce Platform**: John works as a Developer, submitting code
- **Mobile App**: John leads the project, reviewing submissions and running AI tests
- **API Gateway**: John reviews other developers' code

### Scenario 2: Sarah's Leadership
- **E-commerce Platform**: Sarah is the Lead, managing the team
- **Mobile App**: Sarah provides code reviews as a Reviewer

### Scenario 3: New Team Member
1. Alice signs up for an account
2. John (as Lead in Mobile App project) adds Alice as a Developer
3. Sarah (as Lead in E-commerce project) adds Alice as a Reviewer
4. Alice can now switch between Developer and Reviewer roles

## Benefits

- **Flexibility**: Users can contribute to multiple projects in different capacities
- **Realistic Workflow**: Mirrors real-world team structures where senior developers might lead some projects while developing in others
- **Growth Path**: Allows users to take on leadership roles without losing their developer role in other projects
- **Better Collaboration**: Team members can understand different perspectives by experiencing multiple roles
