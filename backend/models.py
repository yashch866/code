from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
from datetime import datetime

class UserBase(BaseModel):
    username: str
    name: str
    email: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str
    roles: Optional[Dict[str, List[str]]] = None  # project_id -> list of roles

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class Project(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    created_date: datetime

class ProjectMember(BaseModel):
    id: str
    user_id: str
    project_id: str
    role: str  # 'developer', 'lead', 'reviewer'

class ManualTest(BaseModel):
    id: str
    submission_id: str
    name: str
    status: str  # 'passed', 'failed', 'pending'
    description: Optional[str] = None

class AITestResults(BaseModel):
    total: int
    passed: int
    failed: int
    coverage: float
    insights: List[str]
    generatedTests: List[Dict]
    codeQuality: Dict
    recommendations: List[str]

class Submission(BaseModel):
    id: str
    project_id: str
    project_name: str
    developer_id: str
    developer_name: str
    code: Optional[str] = None
    description: str
    submitted_date: datetime
    status: str  # 'submitted', 'lead-review', 'ai-testing', 'user-review', 'approved', 'rejected'
    assigned_to: Optional[List[str]] = None
    lead_comments: Optional[str] = None
    reviewer_comments: Optional[str] = None
    ai_test_results: Optional[AITestResults] = None
    files: Optional[List[Dict[str, str]]] = None