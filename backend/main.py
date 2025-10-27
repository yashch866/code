from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from typing import Optional, List, Dict
from datetime import datetime
from dotenv import load_dotenv
from database import get_db  # Direct import
from models import UserCreate, User, UserLogin, Project, Submission, ManualTest
import json
import os
import uuid
import uvicorn

load_dotenv()

app = FastAPI(title="Code Submission Platform API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Vite's default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    try:
        with get_db() as (conn, cursor):
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Auth endpoints
@app.post("/api/auth/login")
async def login(request: Request):
    try:
        data = await request.json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            raise HTTPException(status_code=400, detail="Username and password are required")

        with get_db() as (conn, cursor):
            cursor.execute(
                "SELECT * FROM users WHERE username = %s AND password = %s",
                (username, password)
            )
            user = cursor.fetchone()
            
            if not user:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid username or password"
                )
            
            print(f"Login successful for: {username}")
            return {
                "user": {
                    "id": int(user['id']),  # Convert to number instead of string
                    "username": user['username'],
                    "name": user['name'],
                    "email": user['email']
                }
            }
            
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid username or password")

@app.post("/api/auth/register")
async def register(request: Request):
    try:
        data = await request.json()
        username = data.get('username')
        password = data.get('password')
        name = data.get('name')
        email = data.get('email')

        if not all([username, password, name, email]):
            raise HTTPException(status_code=400, detail="All fields are required")

        with get_db() as (conn, cursor):
            # Check if username already exists
            cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Username already exists")

            # Check if email already exists
            cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Email already exists")

            # Insert new user with auto-incrementing ID
            cursor.execute(
                "INSERT INTO users (username, password, name, email) VALUES (%s, %s, %s, %s)",
                (username, password, name, email)
            )
            # Get the auto-generated ID
            user_id = cursor.lastrowid
            conn.commit()
            print(f"User registered successfully: {username}")
            return {"message": "User registered successfully", "userId": user_id}

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Registration error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# Project endpoints
@app.get("/api/projects")
async def get_projects(user_id: str = None):
    try:
        with get_db() as (conn, cursor):
            if user_id:
                # Get all projects where user is a member
                cursor.execute("""
                    SELECT DISTINCT p.*
                    FROM projects p
                    LEFT JOIN project_members pm ON p.id = pm.project_id
                    WHERE p.creator_id = %s OR pm.user_id = %s
                """, (user_id, user_id))
            else:
                cursor.execute("SELECT * FROM projects")
            
            projects_data = cursor.fetchall()
            projects = []
            
            for project in projects_data:
                # Get all members for this project
                cursor.execute("""
                    SELECT pm.user_id, u.name as user_name, pm.role
                    FROM project_members pm
                    JOIN users u ON pm.user_id = u.id
                    WHERE pm.project_id = %s
                """, (project['id'],))
                
                members = cursor.fetchall()
                
                projects.append({
                    'id': project['id'],
                    'name': project['name'],
                    'description': project['description'],
                    'createdBy': project['creator_id'],
                    'members': [{
                        'userId': member['user_id'],
                        'userName': member['user_name'],
                        'role': member['role']
                    } for member in members]
                })
            
            return projects
    except Exception as e:
        print(f"Error fetching projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/projects")
async def create_project(request: Request):
    try:
        data = await request.json()
        creator_id = data.get('creator_id')
        
        if not creator_id:
            raise HTTPException(status_code=400, detail="Creator ID is required")
            
        print(f"Creating project with data: {data}")
        
        with get_db() as (conn, cursor):
            # Create project
            cursor.execute("""
                INSERT INTO projects (name, description, creator_id)
                VALUES (%s, %s, %s)
            """, (data['name'], data.get('description', ''), creator_id))
            
            project_id = cursor.lastrowid
            
            # Add creator as lead in project_members
            cursor.execute("""
                INSERT INTO project_members (project_id, user_id, role)
                VALUES (%s, %s, 'lead')
            """, (project_id, creator_id))
            
            conn.commit()
            
            # Fetch the created project with member info
            cursor.execute("""
                SELECT p.*, u.name as user_name
                FROM projects p
                JOIN users u ON u.id = p.creator_id
                WHERE p.id = %s
            """, (project_id,))
            
            project = cursor.fetchone()
            
            response = {
                'id': str(project_id),
                'name': project['name'],
                'description': project['description'],
                'createdBy': project['creator_id'],
                'members': [{
                    'userId': creator_id,
                    'userName': project['user_name'],
                    'role': 'lead'
                }]
            }
            
            return {"success": True, "project": response}
            
    except Exception as e:
        print(f"Error creating project: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/projects/members")
async def add_project_member(request: Request):
    try:
        data = await request.json()
        project_id = int(data.get('project_id'))
        user_id = int(data.get('user_id'))
        role = data.get('role')
        
        with get_db() as (conn, cursor):
            # Check if this exact role combination already exists
            cursor.execute("""
                SELECT * FROM project_members 
                WHERE project_id = %s AND user_id = %s AND role = %s
            """, (project_id, user_id, role))
            
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="User already has this role in the project")
            
            # Add the new role for this user
            cursor.execute("""
                INSERT INTO project_members (project_id, user_id, role)
                VALUES (%s, %s, %s)
            """, (project_id, user_id, role))
            
            conn.commit()
            
            # Fetch updated member info
            cursor.execute("""
                SELECT pm.user_id, u.name, pm.role
                FROM project_members pm
                JOIN users u ON pm.user_id = u.id
                WHERE pm.project_id = %s AND pm.user_id = %s AND pm.role = %s
            """, (project_id, user_id, role))
            
            member = cursor.fetchone()
            return {
                'userId': member['user_id'],
                'userName': member['name'],
                'role': member['role']
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error adding member: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/projects/{project_id}/members/{user_id}")
async def remove_project_member(project_id: int, user_id: int):
    try:
        with get_db() as (conn, cursor):
            cursor.execute("""
                DELETE FROM project_members 
                WHERE project_id = %s AND user_id = %s
            """, (project_id, user_id))
            conn.commit()
            return {"success": True}
    except Exception as e:
        print(f"Error removing member: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: int):
    try:
        with get_db() as (conn, cursor):
            # First delete project members
            cursor.execute("DELETE FROM project_members WHERE project_id = %s", (project_id,))
            
            # Then delete the project
            cursor.execute("DELETE FROM projects WHERE id = %s", (project_id,))
            
            conn.commit()
            return {"success": True}
    except Exception as e:
        print(f"Error deleting project: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Submission endpoints
@app.post("/api/submissions")
async def create_submission(request: Request):
    try:
        data = await request.json()
        required_fields = ['project_id', 'developer_id', 'code', 'description']
        
        # Validate required fields
        for field in required_fields:
            if field not in data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        with get_db() as (conn, cursor):
            try:
                # Start transaction
                conn.start_transaction()
                
                # Insert submission
                cursor.execute("""
                    INSERT INTO submissions (project_id, developer_id, code, description, status, submitted_date)
                    VALUES (%s, %s, %s, %s, 'pending', NOW())
                """, (data['project_id'], data['developer_id'], data['code'], data['description']))
                
                submission_id = cursor.lastrowid
                
                # Insert manual tests if provided
                if 'manual_tests' in data and data['manual_tests']:
                    for test in data['manual_tests']:
                        cursor.execute("""
                            INSERT INTO manual_tests (submission_id, name, status, description)
                            VALUES (%s, %s, %s, %s)
                        """, (submission_id, test['name'], test['status'], test['description']))
                
                # Commit transaction
                conn.commit()
                
                return {"message": "Submission created successfully", "id": submission_id}
                
            except Exception as e:
                # Rollback on error
                conn.rollback()
                raise e
            
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error creating submission: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/submissions")
async def get_submissions(user_id: Optional[str] = None, role: Optional[str] = None):
    try:
        with get_db() as (conn, cursor):
            if role == "developer":
                query = """
                    SELECT s.*, p.name as project_name, u.name as developer_name 
                    FROM submissions s
                    JOIN projects p ON s.project_id = p.id
                    JOIN users u ON s.developer_id = u.id
                    WHERE s.developer_id = %s
                """
                cursor.execute(query, (user_id,))
            elif role in ["lead", "reviewer"]:
                query = """
                    SELECT s.*, p.name as project_name, u.name as developer_name 
                    FROM submissions s
                    JOIN projects p ON s.project_id = p.id
                    JOIN users u ON s.developer_id = u.id
                    JOIN project_members pm ON s.project_id = pm.project_id
                    WHERE pm.user_id = %s AND pm.role = %s
                """
                cursor.execute(query, (user_id, role))
            else:
                query = """
                    SELECT s.*, p.name as project_name, u.name as developer_name 
                    FROM submissions s
                    JOIN projects p ON s.project_id = p.id
                    JOIN users u ON s.developer_id = u.id
                """
                cursor.execute(query)
                
            submissions = cursor.fetchall()
            
            # Get manual tests and AI test results for each submission
            formatted_submissions = []
            for submission in submissions:
                # Get manual tests
                cursor.execute("""
                    SELECT * FROM manual_tests
                    WHERE submission_id = %s
                """, (submission['id'],))
                manual_tests = cursor.fetchall()

                # Get AI test results
                cursor.execute("""
                    SELECT * FROM ai_test_results
                    WHERE submission_id = %s
                """, (submission['id'],))
                ai_tests = cursor.fetchall()

                # Calculate AI test summary
                total_ai_tests = len(ai_tests)
                passed_ai_tests = sum(1 for test in ai_tests if test['status'] == 'passed')
                
                # Convert submission dict to have the expected structure
                formatted_submission = {
                    'id': str(submission['id']),
                    'projectId': str(submission['project_id']),
                    'projectName': submission['project_name'],
                    'developerId': str(submission['developer_id']),
                    'developerName': submission['developer_name'],
                    'submittedDate': submission['submitted_date'].isoformat() if submission['submitted_date'] else None,
                    'status': submission['status'],
                    'code': submission['code'],
                    'description': submission['description'],
                    'manualTests': [
                        {
                            'id': str(test['id']),
                            'name': test['name'],
                            'status': test['status'],
                            'description': test['description']
                        } for test in manual_tests
                    ],
                    'aiTestResults': {
                        'total': total_ai_tests,
                        'passed': passed_ai_tests,
                        'failed': total_ai_tests - passed_ai_tests,
                        'coverage': round(passed_ai_tests / total_ai_tests * 100 if total_ai_tests > 0 else 0),
                        'issues': [test['error_message'] for test in ai_tests if test['error_message']],
                        'tests': [{
                            'testName': test['test_name'],
                            'status': test['status'],
                            'duration': 45,  # Default execution time
                            'description': test['description'] if 'description' in test else None
                        } for test in ai_tests]
                    } if total_ai_tests > 0 else None
                }
                formatted_submissions.append(formatted_submission)
            
            return formatted_submissions
    except Exception as e:
        print(f"Error fetching submissions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Manual Test endpoints
@app.post("/api/manual-tests")
async def create_manual_test(request: Request):
    try:
        data = await request.json()
        required_fields = ['submission_id', 'name', 'status', 'description']
        
        # Validate required fields
        for field in required_fields:
            if field not in data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        with get_db() as (conn, cursor):
            cursor.execute("""
                INSERT INTO manual_tests (submission_id, name, status, description)
                VALUES (%s, %s, %s, %s)
            """, (data['submission_id'], data['name'], data['status'], data['description']))
            
            test_id = cursor.lastrowid
            conn.commit()
            
            return {"message": "Manual test created successfully", "id": test_id}
            
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error creating manual test: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/submissions/{submission_id}/manual-tests")
async def get_manual_tests(submission_id: int):
    try:
        with get_db() as (conn, cursor):
            cursor.execute("""
                SELECT * FROM manual_tests
                WHERE submission_id = %s
            """, (submission_id,))
            tests = cursor.fetchall()
            return [dict(test) for test in tests]
    except Exception as e:
        print(f"Error fetching manual tests: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# AI Test Results endpoints
@app.post("/api/ai-test-results")
async def create_ai_test_result(request: Request):
    try:
        data = await request.json()
        required_fields = ['submission_id', 'test_name', 'test_code', 'expected_output', 
                         'actual_output', 'status']
        
        # Validate required fields
        for field in required_fields:
            if field not in data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")

        with get_db() as (conn, cursor):
            # Insert into ai_test_results table
            cursor.execute("""
                INSERT INTO ai_test_results 
                (submission_id, test_name, test_code, expected_output, actual_output, status, error_message)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                data['submission_id'],
                data['test_name'],
                data['test_code'],
                data['expected_output'],
                data['actual_output'],
                data['status'],
                data.get('error_message', None)
            ))
            
            conn.commit()
            return {"message": "AI test result added successfully"}
            
    except Exception as e:
        print(f"Error creating AI test result: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/submissions/{submission_id}/ai-test-results")
async def get_ai_test_results(submission_id: int):
    try:
        with get_db() as (conn, cursor):
            # Get all test results for this submission
            cursor.execute("""
                SELECT * FROM ai_test_results
                WHERE submission_id = %s
            """, (submission_id,))
            test_results = cursor.fetchall()
            
            # Calculate summary statistics
            total_tests = len(test_results)
            passed_tests = sum(1 for test in test_results if test['status'] == 'passed')
            
            return {
                'total': total_tests,
                'passed': passed_tests,
                'failed': total_tests - passed_tests,
                'coverage': round(passed_tests / total_tests * 100 if total_tests > 0 else 0),
                'issues': [test['error_message'] for test in test_results if test['error_message']],
                'tests': [{
                    'testName': test['test_name'],
                    'status': test['status'],
                    'duration': 45, # Default execution time
                    'description': test['description'] if 'description' in test else None
                } for test in test_results]
            }
    except Exception as e:
        print(f"Error fetching AI test results: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# User endpoints
@app.get("/api/users")
async def get_users():
    try:
        with get_db() as (conn, cursor):
            cursor.execute("""
                SELECT id, username, name, email 
                FROM users
            """)
            users = cursor.fetchall()
            return users
    except Exception as e:
        print(f"Error fetching users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/recent")
async def get_recent_interactions(user_id: int):
    try:
        with get_db() as (conn, cursor):
            # Get users who are in the same projects as the current user
            cursor.execute("""
                SELECT DISTINCT u.id, u.username, u.name, u.email
                FROM users u
                JOIN project_members pm1 ON u.id = pm1.user_id
                JOIN project_members pm2 ON pm1.project_id = pm2.project_id
                WHERE pm2.user_id = %s 
                ORDER BY u.id
                LIMIT 5
            """, (user_id,))
            users = cursor.fetchall()
            return users
    except Exception as e:
        print(f"Error fetching recent users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)