import { SubmissionsList } from './SubmissionsList';
import { Submission, Project, User, UserRole } from '../types';
import { RoleSwitcher } from './RoleSwitcher';
import { Card, CardContent } from './ui/card';
import { AlertCircle } from 'lucide-react';

type LeadDashboardProps = {
  submissions: Submission[];
  projects: Project[];
  currentUser: User;
  currentRole: UserRole;
  availableRoles: UserRole[];
  onRoleChange: (role: UserRole) => void;
  onSelectSubmission: (submission: Submission) => void;
};

export function LeadDashboard({ 
  submissions, 
  projects,
  currentUser,
  currentRole,
  availableRoles,
  onRoleChange,
  onSelectSubmission 
}: LeadDashboardProps) {
  // Get projects where user is a lead
  const leadProjects = projects.filter(p => 
    p.members.some(m => m.userId === currentUser.id && m.role === 'lead')
  );

  // Filter submissions from projects where user is lead AND assigned to them
  const assignedSubmissions = submissions.filter(
    (sub) => {
      const isLeadOfProject = leadProjects.some(p => p.id === sub.projectId);
      const isAssignedToMe = sub.assignedTo?.includes(currentUser.id);
      return isLeadOfProject && isAssignedToMe;
    }
  );

  const pendingReview = assignedSubmissions.filter(
    (sub) => sub.status === 'submitted' || sub.status === 'lead-review'
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Project Lead Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Review submissions with comprehensive AI test results and manage your team's code quality
        </p>
      </div>

      <RoleSwitcher
        currentRole={currentRole}
        availableRoles={availableRoles}
        onRoleChange={onRoleChange}
        projects={projects}
        userId={currentUser.id}
      />

      {leadProjects.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-xl mb-2">No Projects Assigned</h3>
            <p className="text-muted-foreground text-center max-w-md">
              You haven't been assigned to any projects as a lead yet. Create a new project or ask to be assigned as a lead.
            </p>
          </CardContent>
        </Card>
      ) : assignedSubmissions.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-xl mb-2">No Submissions Assigned</h3>
            <p className="text-muted-foreground text-center max-w-md">
              You don't have any submissions assigned to you for review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <SubmissionsList
          submissions={pendingReview}
          onSelectSubmission={onSelectSubmission}
          title="Pending Review"
        />
      )}
    </div>
  );
}
