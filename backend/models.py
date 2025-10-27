from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class UserOut(BaseModel):
    id: str
    username: str
    name: str

class TokenWithUser(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

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
    id: int
    user_id: int
    project_id: int
    role: str  # 'developer', 'lead', 'reviewer'
    name: Optional[str] = None  # For displaying member names

class ManualTest(BaseModel):
    id: str
    submission_id: str
    name: str
    status: str  # 'passed', 'failed', 'pending'
    description: Optional[str] = None

class AITestResults(BaseModel):
    id: Optional[int] = None
    submission_id: Optional[int] = None
    function_code: Optional[str] = None
    test_name: Optional[str] = None
    test_code: Optional[str] = None
    expected_output: Optional[str] = None
    actual_output: Optional[str] = None
    status: Optional[str] = None  # Status of the test execution
    error_message: Optional[str] = None
    created_at: Optional[datetime] = None
    total: Optional[int] = 0
    passed: Optional[int] = 0
    failed: Optional[int] = 0
    coverage: Optional[float] = 0
    tests: Optional[List[Dict]] = []

class Submission(BaseModel):
    id: int
    project_id: int
    project_name: str
    developer_id: int
    developer_name: str
    code: Optional[str] = None
    description: str
    submitted_date: datetime
    status: str  # 'submitted', 'lead-review', 'ai-testing', 'user-review', 'approved', 'rejected'
    assigned_to: Optional[List[int]] = None
    lead_comments: Optional[str] = None
    reviewer_comments: Optional[str] = None
    ai_test_results: Optional[AITestResults] = None
    manual_tests: Optional[List[Dict[str, Any]]] = None