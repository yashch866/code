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
                cursor.execute("""
                    SELECT p.*, pm.role
                    FROM projects p
                    LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = %s
                    WHERE p.creator_id = %s OR pm.user_id = %s
                """, (user_id, user_id, user_id))
            else:
                cursor.execute("SELECT * FROM projects")
            
            projects = {}
            for row in cursor.fetchall():
                project_id = row['id']
                if project_id not in projects:
                    projects[project_id] = {
                        'id': project_id,  # Keep as number
                        'name': row['name'],
                        'description': row['description'],
                        'createdBy': int(row['creator_id']),  # Convert to number
                        'members': []
                    }
                    
                    # Fetch members for this project
                    cursor.execute("""
                        SELECT pm.user_id, u.name, pm.role
                        FROM project_members pm
                        JOIN users u ON pm.user_id = u.id
                        WHERE pm.project_id = %s
                    """, (project_id,))
                    
                    members = cursor.fetchall()
                    for member in members:
                        projects[project_id]['members'].append({
                            'userId': int(member['user_id']),  # Convert to number
                            'userName': member['name'],
                            'role': member['role']
                        })
            
            return list(projects.values())
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
            # Add member to project
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
                WHERE pm.project_id = %s AND pm.user_id = %s
            """, (project_id, user_id))
            
            member = cursor.fetchone()
            return {
                'userId': member['user_id'],
                'userName': member['name'],
                'role': member['role']
            }
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
async def create_submission(
    project_id: str,
    developer_id: str,
    code: Optional[str] = None,
    description: str = None,
    files: Optional[List[Dict[str, str]]] = None,
    manual_tests: Optional[List[Dict]] = None,
    ai_test_results: Optional[Dict] = None
):
    try:
        with get_db() as (conn, cursor):
            # Get project name
            cursor.execute("SELECT name FROM projects WHERE id = %s", (project_id,))
            project = cursor.fetchone()
            if not project:
                raise HTTPException(status_code=404, detail="Project not found")
            
            # Get developer name
            cursor.execute("SELECT name FROM users WHERE id = %s", (developer_id,))
            developer = cursor.fetchone()
            if not developer:
                raise HTTPException(status_code=404, detail="Developer not found")
            
            # Insert submission
            cursor.execute("""
                INSERT INTO submissions (
                    project_id, project_name, developer_id, developer_name,
                    code, description, submitted_date, status, files, ai_test_results
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, NOW(), 'submitted', %s, %s)
            """, (
                project_id,
                project['name'],
                developer_id,
                developer['name'],
                code,
                description,
                json.dumps(files) if files else None,
                json.dumps(ai_test_results) if ai_test_results else None
            ))
            
            submission_id = cursor.lastrowid
            
            # Insert manual tests if provided
            if manual_tests:
                for test in manual_tests:
                    cursor.execute("""
                        INSERT INTO manual_tests (submission_id, name, status, description)
                        VALUES (%s, %s, %s, %s)
                    """, (submission_id, test["name"], test["status"], test.get("description")))
            
            conn.commit()
            return {"message": "Submission created successfully", "id": submission_id}
    except Exception as e:
        print(f"Error creating submission: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/submissions")
async def get_submissions(user_id: Optional[str] = None, role: Optional[str] = None):
    try:
        with get_db() as (conn, cursor):
            if role == "developer":
                cursor.execute("SELECT * FROM submissions WHERE developer_id = %s", (user_id,))
            elif role in ["lead", "reviewer"]:
                cursor.execute("""
                    SELECT s.* FROM submissions s
                    JOIN project_members pm ON s.project_id = pm.project_id
                    WHERE pm.user_id = %s AND pm.role = %s
                """, (user_id, role))
            else:
                cursor.execute("SELECT * FROM submissions")
                
            submissions = cursor.fetchall()
            return submissions
    except Exception as e:
        print(f"Error fetching submissions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)