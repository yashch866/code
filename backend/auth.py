from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from contextlib import contextmanager
from mysql.connector import connect, Error
from mysql.connector.pooling import MySQLConnectionPool
import os

# ============= DATABASE CONFIGURATION =============
db_config = {
    "host": "localhost",
    "user": "codeuser",
    "password": "code123",
    "database": "code_submission_db",
    "pool_name": "mypool",
    "pool_size": 5
}

try:
    connection_pool = MySQLConnectionPool(**db_config)
    print("✓ Database pool created successfully")
except Error as e:
    print(f"✗ Error creating database pool: {e}")
    raise e

@contextmanager
def get_db():
    """Get a database connection from the pool"""
    connection = None
    cursor = None
    try:
        connection = connection_pool.get_connection()
        cursor = connection.cursor(dictionary=True)
        yield cursor, connection
    except Exception as e:
        if connection and connection.is_connected():
            connection.rollback()
        print(f"Database error: {e}")
        raise e
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

# Database initialization
def init_db():
    """Initialize database tables"""
    try:
        with get_db() as (cursor, connection):
            # Create users table if not exists
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR(36) PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password VARCHAR(100) NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    INDEX username_idx (username),
                    INDEX email_idx (email)
                )
            """)
            
            # Create projects table if not exists
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS projects (
                    id VARCHAR(36) PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status VARCHAR(20) DEFAULT 'active',
                    INDEX name_idx (name),
                    INDEX status_idx (status)
                )
            """)
            
            # Create project_members table if not exists
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS project_members (
                    project_id VARCHAR(36),
                    user_id VARCHAR(36),
                    role VARCHAR(20) NOT NULL,
                    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (project_id, user_id),
                    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    INDEX role_idx (role)
                )
            """)
            
            connection.commit()
            print("✓ Database tables created successfully")
    except Exception as e:
        print(f"✗ Database initialization error: {e}")
        raise e

# Initialize database tables
init_db()

# ============= PYDANTIC MODELS =============
class UserRegister(BaseModel):
    username: str
    password: str
    name: str
    email: str

class UserLogin(BaseModel):
    username: str
    password: str

# ============= AUTH FUNCTIONS =============
def verify_password(plain_password: str, stored_password: str) -> bool:
    """Plain text password comparison"""
    return plain_password == stored_password

def get_user_by_username(username: str):
    """Fetch user from database by username"""
    try:
        with get_db() as (cursor, connection):
            cursor.execute(
                "SELECT id, username, password, name, email FROM users WHERE username = %s",
                (username,)
            )
            user = cursor.fetchone()
            return user
    except Exception as e:
        print(f"Error fetching user: {e}")
        return None

# ============= FASTAPI APP =============
app = FastAPI(title="Code Submission API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============= ENDPOINTS =============
@app.post("/api/auth/register")
async def register(user_data: UserRegister):
    """Register a new user"""
    try:
        with get_db() as (cursor, connection):
            # Check if username already exists
            cursor.execute(
                "SELECT id FROM users WHERE username = %s",
                (user_data.username,)
            )
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Username already exists")
            
            # Check if email already exists
            cursor.execute(
                "SELECT id FROM users WHERE email = %s",
                (user_data.email,)
            )
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Email already exists")
            
            # Insert new user (plain text password)
            cursor.execute(
                """INSERT INTO users (username, password, name, email) 
                   VALUES (%s, %s, %s, %s)""",
                (user_data.username, user_data.password, user_data.name, user_data.email)
            )
            connection.commit()
            
            return {"message": "User created successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/api/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        with get_db() as (cursor, connection):
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
            
            return {
                "user": {
                    "id": str(user["id"]),
                    "username": user["username"],
                    "name": user["name"],
                    "email": user["email"]
                }
            }
            
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    try:
        with get_db() as (cursor, connection):
            cursor.execute("SELECT 1")
            cursor.fetchone()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

# ============= DEBUGGING ENDPOINT =============
@app.get("/api/debug/users")
async def debug_list_users():
    """Debug endpoint to list all users (REMOVE IN PRODUCTION!)"""
    try:
        with get_db() as (cursor, connection):
            cursor.execute("SELECT id, username, name, email FROM users")
            users = cursor.fetchall()
            return {"users": users, "count": len(users)}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    print("Starting server on http://localhost:8000")
    print("API docs available at http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)