import React, { useState } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Navigation } from './components/Navigation';
import { DeveloperDashboard } from './components/DeveloperDashboard';
import { LeadDashboard } from './components/LeadDashboard';
import { ReviewerDashboard } from './components/ReviewerDashboard';
import { SubmissionDetail } from './components/SubmissionDetail';
import { ProjectsArchive } from './components/ProjectsArchive';
import { ProjectManagement } from './components/ProjectManagement';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { mockSubmissions, mockCompany, mockProjects } from './data/mockData';
import { Submission, User, Project, UserRole, ProjectMember } from './types';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { authApi, projectsApi } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('developer');
  const [users, setUsers] = useState<User[]>(mockCompany.users);
  const [projects, setProjects] = useState<Project[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>(mockSubmissions);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [currentView, setCurrentView] = useState('main');

  // Add effect to fetch projects when view changes to manage-projects
  React.useEffect(() => {
    if (currentView === 'manage-projects' && currentUser) {
      fetchProjects();
    }
  }, [currentView, currentUser]);

  // Add function to fetch projects
  const fetchProjects = async () => {
    try {
      // If user is logged in, fetch their projects, otherwise fetch all projects
      const response = currentUser?.id 
        ? await projectsApi.getByUser(currentUser.id)
        : await projectsApi.getAll();
        
      if (response.data) {
        setProjects(response.data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    }
  };

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.login(username, password);
      console.log('Login response:', response.data);

      if (response.data.user) {
        setCurrentUser({
          id: response.data.user.id,
          username: response.data.user.username,
          name: response.data.user.name,
          email: response.data.user.email
        });
        
        // Fetch projects after successful login
        await fetchProjects();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Login error:', error);
      return false;
    }
  };

  const handleSignUp = async (username: string, password: string, name: string, email: string): Promise<boolean> => {
    try {
      await authApi.register({ username, password, name, email });
      toast.success('Account created successfully!', {
        description: 'You can now log in with your credentials.',
      });
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error creating account');
      return false;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentRole('developer');
    setSelectedSubmission(null);
    setCurrentView('main');
  };

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    setCurrentView('main');
  };

  const handleNewSubmission = (
    newSubmission: Omit<Submission, 'id' | 'submittedDate' | 'status' | 'developerId' | 'assignedTo'>
  ) => {
    if (!currentUser) return;

    const project = projects.find(p => p.id === newSubmission.projectId);
    if (!project) return;

    // Automatically assign to all leads and reviewers in the project
    const assignedTo = project.members
      .filter(m => m.role === 'lead' || m.role === 'reviewer')
      .map(m => m.userId);

    const submission: Submission = {
      ...newSubmission,
      id: Date.now().toString(),
      developerId: currentUser.id,
      assignedTo,
      submittedDate: new Date().toISOString(),
      status: 'submitted',
    };

    setSubmissions([submission, ...submissions]);
    toast.success('Code submitted successfully!', {
      description: 'Your submission has been sent to the project leads for review.',
    });
  };

  // Update handleCreateProject to fetch all projects after creation
  const handleCreateProject = async (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    try {
      const response = await projectsApi.create({
        name: projectData.name,
        description: projectData.description,
        creator_id: currentUser?.id
      });
      
      if (response.data.success) {
        // Add the new project to the existing list
        const newProject = response.data.project;
        setProjects(prev => [...prev, newProject]);
        toast.success('Project created successfully');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    }
  };

  const handleAddMember = (projectId: string, userId: string, role: UserRole) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    setProjects(
      projects.map((p) => {
        if (p.id === projectId) {
          const newMember: ProjectMember = {
            userId: user.id,
            userName: user.name,
            role,
            assignedAt: new Date().toISOString(),
          };
          return {
            ...p,
            members: [...p.members, newMember],
          };
        }
        return p;
      })
    );
  };

  const handleRemoveMember = (projectId: string, userId: string) => {
    setProjects(
      projects.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            members: p.members.filter((m) => m.userId !== userId),
          };
        }
        return p;
      })
    );
    toast.success('Member removed from project');
  };

  const handleDeleteProject = (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      setProjects(projects.filter((p) => p.id !== projectId));
      // Also remove submissions for this project
      setSubmissions(submissions.filter((s) => s.projectId !== projectId));
      toast.success('Project deleted');
    }
  };

  const handleApprove = (submissionId: string, comments: string) => {
    setSubmissions((prev) =>
      prev.map((sub) => {
        if (sub.id === submissionId) {
          const updatedSub = {
            ...sub,
            status: 'approved' as const,
            reviewComments: comments,
          };

          if (selectedSubmission?.id === submissionId) {
            setSelectedSubmission(updatedSub);
          }

          return updatedSub;
        }
        return sub;
      })
    );

    toast.success('Submission approved!', {
      description: 'The developer has been notified.',
    });
  };

  const handleReject = (submissionId: string, comments: string) => {
    setSubmissions((prev) =>
      prev.map((sub) => {
        if (sub.id === submissionId) {
          const updatedSub = {
            ...sub,
            status: 'rejected' as const,
            reviewComments: comments,
          };

          if (selectedSubmission?.id === submissionId) {
            setSelectedSubmission(updatedSub);
          }

          return updatedSub;
        }
        return sub;
      })
    );

    toast.error('Submission rejected', {
      description: 'The developer has been notified with your feedback.',
    });
  };

  const handleSelectSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
  };

  const handleBackFromDetail = () => {
    setSelectedSubmission(null);
  };

  // Add effect to fetch projects when view changes
  React.useEffect(() => {
    if (currentView === 'manage-projects') {
      fetchProjects();
    }
  }, [currentView]);

  // Show login screen if not authenticated
  if (!currentUser) {
    return (
      <>
        <Toaster />
        <LoginScreen onLogin={handleLogin} onSignUp={handleSignUp} />
      </>
    );
  }

  // Get available roles for current user based on their project assignments
  const userProjects = projects.filter(p => 
    p.members.some(m => m.userId === currentUser.id)
  );
  
  const availableRoles = Array.from(
    new Set(
      userProjects.flatMap(p => 
        p.members
          .filter(m => m.userId === currentUser.id)
          .map(m => m.role)
      )
    )
  ) as UserRole[];

  // If user has no roles, default to showing them as developer
  const effectiveRoles = availableRoles.length > 0 ? availableRoles : ['developer'] as UserRole[];
  const effectiveRole = effectiveRoles.includes(currentRole) ? currentRole : effectiveRoles[0];

  // Render detail view if submission is selected
  if (selectedSubmission) {
    return (
      <div className="min-h-screen bg-background">
        <Toaster />
        <Navigation
          userName={currentUser.name}
          currentView={currentView}
          onNavigate={setCurrentView}
          onLogout={handleLogout}
        />
        <div className="container mx-auto px-6 py-8">
          <SubmissionDetail
            submission={selectedSubmission}
            onBack={handleBackFromDetail}
            onApprove={effectiveRole === 'lead' || effectiveRole === 'reviewer' ? handleApprove : undefined}
            onReject={effectiveRole === 'lead' || effectiveRole === 'reviewer' ? handleReject : undefined}
            userRole={effectiveRole}
          />
        </div>
      </div>
    );
  }

  // Render main view based on current selection
  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <Navigation
        userName={currentUser.name}
        currentView={currentView}
        onNavigate={setCurrentView}
        onLogout={handleLogout}
      />
      
      <div className="container mx-auto px-6 py-8">
        {currentView === 'main' && effectiveRole === 'developer' && (
          <DeveloperDashboard
            submissions={submissions}
            projects={userProjects}
            currentUser={currentUser}
            currentRole={effectiveRole}
            availableRoles={effectiveRoles}
            onRoleChange={handleRoleChange}
            onSubmit={handleNewSubmission}
            onSelectSubmission={handleSelectSubmission}
          />
        )}

        {currentView === 'main' && effectiveRole === 'lead' && (
          <LeadDashboard
            submissions={submissions}
            projects={userProjects}
            currentUser={currentUser}
            currentRole={effectiveRole}
            availableRoles={effectiveRoles}
            onRoleChange={handleRoleChange}
            onSelectSubmission={handleSelectSubmission}
          />
        )}

        {currentView === 'main' && effectiveRole === 'reviewer' && (
          <ReviewerDashboard
            submissions={submissions}
            projects={userProjects}
            currentUser={currentUser}
            currentRole={effectiveRole}
            availableRoles={effectiveRoles}
            onRoleChange={handleRoleChange}
            onSelectSubmission={handleSelectSubmission}
          />
        )}

        {currentView === 'projects' && (
          <ProjectsArchive
            submissions={submissions}
            onViewSubmission={handleSelectSubmission}
          />
        )}

        {currentView === 'manage-projects' && (
          <ProjectManagement
            projects={projects}
            currentUser={currentUser}
            companyUsers={users}
            onCreateProject={handleCreateProject}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            onDeleteProject={handleDeleteProject}
          />
        )}

        {currentView === 'analytics' && (
          <AnalyticsDashboard submissions={submissions} />
        )}
      </div>
    </div>
  );
}
