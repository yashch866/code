import { SubmissionForm } from './SubmissionForm';
import { SubmissionsList } from './SubmissionsList';
import { Submission, Project, User } from '../types';
import { RoleSwitcher } from './RoleSwitcher';
import { UserRole } from '../types';
import { Card, CardContent } from './ui/card';
import { AlertCircle } from 'lucide-react';

type DeveloperDashboardProps = {
  submissions: Submission[];
  projects: Project[];
  currentUser: User;
  currentRole: UserRole;
  availableRoles: UserRole[];
  onRoleChange: (role: UserRole) => void;
  onSubmit: (submission: Omit<Submission, 'id' | 'submittedDate' | 'status' | 'developerId' | 'assignedTo'>) => void;
  onSelectSubmission: (submission: Submission) => void;
};

export function DeveloperDashboard({ 
  submissions, 
  projects,
  currentUser,
  currentRole,
  availableRoles,
  onRoleChange,
  onSubmit, 
  onSelectSubmission 
}: DeveloperDashboardProps) {
  // Filter submissions where current user is the developer
  const mySubmissions = submissions.filter(
    (sub) => Number(sub.developerId) === currentUser.id
  );

  // Get projects where user is a developer
  const developerProjects = projects.filter(p => 
    p.members.some(m => m.userId === currentUser.id && 
    (m.role === 'developer' || m.role === 'lead'))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Developer Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Submit new code and track your submissions
        </p>
      </div>

      <RoleSwitcher
        currentRole={currentRole}
        availableRoles={availableRoles}
        onRoleChange={onRoleChange}
        projects={projects}
        userId={currentUser.id}
      />

      {developerProjects.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-xl mb-2">No Projects Assigned</h3>
            <p className="text-muted-foreground text-center max-w-md">
              You haven't been assigned to any projects as a developer yet. Contact your project lead to get assigned to projects.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <SubmissionForm 
            onSubmit={onSubmit} 
            projects={developerProjects}
            currentUser={currentUser}
          />
          
          <SubmissionsList
            submissions={mySubmissions}
            onSelectSubmission={onSelectSubmission}
            title="My Submissions"
          />
        </>
      )}
    </div>
  );
}
