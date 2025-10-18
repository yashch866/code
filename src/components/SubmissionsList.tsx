import React from 'react';
import { Submission } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { CheckCircle2, XCircle, Clock, PlayCircle, Sparkles, FileCode } from 'lucide-react';

type SubmissionsListProps = {
  submissions: Submission[];
  onSelectSubmission: (submission: Submission) => void;
  title: string;
};

const statusConfig = {
  submitted: { label: 'Submitted', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400', icon: Clock },
  'lead-review': { label: 'Lead Review', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400', icon: PlayCircle },
  'ai-testing': { label: 'AI Testing', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400', icon: PlayCircle },
  'user-review': { label: 'User Review', color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400', icon: PlayCircle },
  approved: { label: 'Approved', color: 'bg-green-500/10 text-green-700 dark:text-green-400', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-500/10 text-red-700 dark:text-red-400', icon: XCircle },
  default: { label: 'Processing', color: 'bg-gray-500/10 text-gray-700 dark:text-gray-400', icon: Clock }
} as const;

export function SubmissionsList({ submissions, onSelectSubmission, title }: SubmissionsListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
            <FileCode className="size-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-center">
              No submissions available yet
            </p>
            <p className="text-sm text-muted-foreground/70 text-center mt-1">
              Submissions will appear here once code is submitted
            </p>
          </div>
        ) : (
          submissions.map((submission) => {
            const config = statusConfig[submission.status as keyof typeof statusConfig] || statusConfig.default;
            const Icon = config.icon;
            const passedTests = submission.manualTests?.filter(t => t.status === 'passed').length ?? 0;
            const totalTests = submission.manualTests?.length ?? 0;
            const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

            return (
              <div
                key={submission.id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4>{submission.projectName}</h4>
                    <Badge className={config.color}>
                      <Icon className="size-3 mr-1" />
                      {config.label}
                    </Badge>
                    {submission.aiTestResults && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                        <Sparkles className="size-3 mr-1" />
                        AI Tested
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">
                    by {submission.developerName} • {formatDate(submission.submittedDate)}
                  </p>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>
                      Manual Tests: {passedTests}/{totalTests} ({passRate}%)
                    </span>
                    {submission.aiTestResults && (
                      <span>
                        AI Tests: {submission.aiTestResults.passed}/{submission.aiTestResults.total}
                      </span>
                    )}
                  </div>
                </div>
                <Button onClick={() => onSelectSubmission(submission)} variant="outline">
                  View Details
                </Button>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
