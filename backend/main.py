from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from typing import Optional, List, Dict
from datetime import datetime
from dotenv import load_dotenv
from database import get_db
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
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        with get_db() as (conn, cursor):
            cursor.execute(
                "SELECT id, username, name, email FROM users WHERE username = %s AND password = %s",
                (form_data.username, form_data.password)
            )
            user = cursor.fetchone()
            
            if not user:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid username or password"
                )
            
            print(f"Login successful for: {form_data.username}")
            return {"user": user}
            
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid username or password")

@app.post("/api/auth/register")
async def register(request: Request):
    try:
        data = await request.json()
        username = data.get('username')
        password = data.get('password')  # Plain text password
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

            # Insert new user with plain text password
            user_id = str(uuid.uuid4())
            cursor.execute(
                "INSERT INTO users (id, username, password, name, email) VALUES (%s, %s, %s, %s, %s)",
                (user_id, username, password, name, email)
            )
            conn.commit()
            print(f"User registered successfully: {username}")  # Added debug print
            return {"message": "User registered successfully", "userId": user_id}

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Registration error: {str(e)}")  # Added debug print
        raise HTTPException(status_code=400, detail=str(e))

# Project endpoints
@app.get("/api/projects")
async def get_projects(user_id: str = None, db = Depends(get_db)):
    try:
        cursor = db.cursor(dictionary=True)
        if user_id:
            cursor.execute("""
                SELECT p.*, pm.role 
                FROM projects p
                JOIN project_members pm ON p.id = pm.project_id
                WHERE pm.user_id = %s
            """, (user_id,))
        else:
            cursor.execute("SELECT * FROM projects")
        projects = cursor.fetchall()
        cursor.close()
        return projects
    except Exception as e:
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
    ai_test_results: Optional[Dict] = None,
    db = Depends(get_db)
):
    try:
        cursor = db.cursor()
        
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
                id, project_id, project_name, developer_id, developer_name,
                code, description, submitted_date, status, files, ai_test_results
            ) VALUES (
                UUID(), %s, %s, %s, %s, %s, %s, NOW(), 'submitted', %s, %s
        """, (
            project_id,
            project[0],
            developer_id,
            developer[0],
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
                    INSERT INTO manual_tests (id, submission_id, name, status, description)
                    VALUES (UUID(), %s, %s, %s, %s)
                """, (submission_id, test["name"], test["status"], test.get("description")))
        
        db.commit()
        cursor.close()
        return {"message": "Submission created successfully", "id": submission_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/submissions")
async def get_submissions(
    user_id: Optional[str] = None,
    role: Optional[str] = None,
    db = Depends(get_db)
):
    try:
        cursor = db.cursor(dictionary=True)
        
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
        cursor.close()
        return submissions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)