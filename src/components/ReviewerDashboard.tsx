import { SubmissionsList } from './SubmissionsList';
import { Submission, Project, User, UserRole } from '../types';
import { RoleSwitcher } from './RoleSwitcher';
import { Card, CardContent } from './ui/card';
import { AlertCircle } from 'lucide-react';

type ReviewerDashboardProps = {
  submissions: Submission[];
  projects: Project[];
  currentUser: User;
  currentRole: UserRole;
  availableRoles: UserRole[];
  onRoleChange: (role: UserRole) => void;
  onSelectSubmission: (submission: Submission) => void;
};

export function ReviewerDashboard({ 
  submissions, 
  projects,
  currentUser,
  currentRole,
  availableRoles,
  onRoleChange,
  onSelectSubmission 
}: ReviewerDashboardProps) {
  // Get projects where user is a reviewer
  const reviewerProjects = projects.filter(p => 
    p.members.some(m => m.userId === currentUser.id && m.role === 'reviewer')
  );

  // Filter submissions from projects where user is reviewer AND assigned to them
  const assignedSubmissions = submissions.filter(
    (sub) => {
      const isReviewerOfProject = reviewerProjects.some(p => p.id === sub.projectId);
      const isAssignedToMe = sub.assignedTo?.includes(currentUser.id);
      return isReviewerOfProject && isAssignedToMe;
    }
  );

  const pendingReview = assignedSubmissions.filter(
    (sub) => sub.status === 'user-review' || sub.status === 'ai-testing'
  );

  const reviewed = assignedSubmissions.filter(
    (sub) => sub.status === 'approved' || sub.status === 'rejected'
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Reviewer Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Review code submissions and provide final approval
        </p>
      </div>

      <RoleSwitcher
        currentRole={currentRole}
        availableRoles={availableRoles}
        onRoleChange={onRoleChange}
        projects={projects}
        userId={currentUser.id}
      />

      {reviewerProjects.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-xl mb-2">No Projects Assigned</h3>
            <p className="text-muted-foreground text-center max-w-md">
              You haven't been assigned to any projects as a reviewer yet. Ask your project lead to assign you to projects.
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
        <>
          <SubmissionsList
            submissions={pendingReview}
            onSelectSubmission={onSelectSubmission}
            title="Pending My Review"
          />

          {reviewed.length > 0 && (
            <SubmissionsList
              submissions={reviewed}
              onSelectSubmission={onSelectSubmission}
              title="Reviewed by Me"
            />
          )}
        </>
      )}
    </div>
  );
}
