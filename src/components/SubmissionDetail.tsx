import { Submission } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { CheckCircle2, XCircle, AlertCircle, ArrowLeft, Download, File, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner@2.0.3';

type SubmissionDetailProps = {
  submission: Submission;
  onBack: () => void;
  onApprove?: (submissionId: string, comments: string) => void;
  onReject?: (submissionId: string, comments: string) => void;
  userRole: 'developer' | 'lead' | 'reviewer';
};

export function SubmissionDetail({
  submission,
  onBack,
  onApprove,
  onReject,
  userRole,
}: SubmissionDetailProps) {
  const [comments, setComments] = useState('');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const passedManualTests = submission.manualTests.filter(t => t.status === 'passed').length;
  const totalManualTests = submission.manualTests.length;
  const manualPassRate = totalManualTests > 0 ? Math.round((passedManualTests / totalManualTests) * 100) : 0;

  const aiPassRate = submission.aiTestResults
    ? Math.round((submission.aiTestResults.passed / submission.aiTestResults.total) * 100)
    : 0;



  const handleDownloadFile = (file: { name: string; content: string }) => {
    try {
      const a = document.createElement('a');
      a.href = file.content;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success(`${file.name} downloaded successfully!`);
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="ghost" size="icon">
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h2>{submission.projectName}</h2>
          <p className="text-muted-foreground">
            Submitted by {submission.developerName} on {formatDate(submission.submittedDate)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Manual Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total: {totalManualTests}</span>
              </div>
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="size-4" />
                <span>Passed: {passedManualTests}</span>
              </div>
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <XCircle className="size-4" />
                <span>Failed: {totalManualTests - passedManualTests}</span>
              </div>
              <Progress value={manualPassRate} className="mt-2" />
              <p className="text-muted-foreground">{manualPassRate}% pass rate</p>
            </div>
          </CardContent>
        </Card>

        {submission.aiTestResults && (
          <>
            <Card className="border-2 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="size-5 text-purple-600" />
                  <CardTitle>AI Automated Tests</CardTitle>
                </div>
                <CardDescription className="text-xs">Run by developer before submission</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total: {submission.aiTestResults.total}</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="size-4" />
                    <span>Passed: {submission.aiTestResults.passed}</span>
                  </div>
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <XCircle className="size-4" />
                    <span>Failed: {submission.aiTestResults.failed}</span>
                  </div>
                  <Progress value={aiPassRate} className="mt-2" />
                  <p className="text-muted-foreground">{aiPassRate}% pass rate</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="size-5 text-purple-600" />
                  <CardTitle>Code Coverage</CardTitle>
                </div>
                <CardDescription className="text-xs">Generated by AI testing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-center">
                    <div className="text-3xl">{submission.aiTestResults.coverage}%</div>
                  </div>
                  <Progress value={submission.aiTestResults.coverage} className="mt-2" />
                  <p className="text-muted-foreground text-center">
                    {submission.aiTestResults.coverage >= 80 ? 'Good coverage' : 'Needs improvement'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card className="border-2 shadow-sm">
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{submission.description}</p>
        </CardContent>
      </Card>

      <Card className="border-2 shadow-sm">
        <CardHeader>
          <CardTitle>Manual Test Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {submission.manualTests.map((test, index) => (
              <div
                key={test.id}
                className="p-4 border rounded-lg space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {test.status === 'passed' ? (
                      <CheckCircle2 className="size-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="size-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h4>{test.name}</h4>
                      <p className="text-muted-foreground mt-1">{test.description}</p>
                    </div>
                  </div>
                  <Badge variant={test.status === 'passed' ? 'default' : 'destructive'}>
                    {test.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {submission.aiCodeAnalysis && (
        <Card className="border-2 shadow-sm bg-gradient-to-br from-purple-50/30 to-blue-50/30 dark:from-purple-950/10 dark:to-blue-950/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-purple-600" />
              <CardTitle>AI Code Analysis</CardTitle>
            </div>
            <CardDescription>Comprehensive code quality analysis run by developer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Security</span>
                  <span className={submission.aiCodeAnalysis.securityScore >= 80 ? 'text-green-600' : 'text-yellow-600'}>
                    {submission.aiCodeAnalysis.securityScore}%
                  </span>
                </div>
                <Progress value={submission.aiCodeAnalysis.securityScore} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Performance</span>
                  <span className={submission.aiCodeAnalysis.performanceScore >= 80 ? 'text-green-600' : 'text-yellow-600'}>
                    {submission.aiCodeAnalysis.performanceScore}%
                  </span>
                </div>
                <Progress value={submission.aiCodeAnalysis.performanceScore} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Maintainability</span>
                  <span className={submission.aiCodeAnalysis.maintainabilityScore >= 80 ? 'text-green-600' : 'text-yellow-600'}>
                    {submission.aiCodeAnalysis.maintainabilityScore}%
                  </span>
                </div>
                <Progress value={submission.aiCodeAnalysis.maintainabilityScore} />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-muted-foreground">Cyclomatic Complexity</div>
                <div className="text-2xl mt-1">{submission.aiCodeAnalysis.complexityMetrics.cyclomaticComplexity}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Lines of Code</div>
                <div className="text-2xl mt-1">{submission.aiCodeAnalysis.complexityMetrics.linesOfCode}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Cognitive Complexity</div>
                <div className="text-2xl mt-1">{submission.aiCodeAnalysis.complexityMetrics.cognitiveComplexity}</div>
              </div>
            </div>

            {submission.aiCodeAnalysis.suggestions.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="mb-3">Suggestions</h4>
                  <ul className="space-y-2">
                    {submission.aiCodeAnalysis.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {submission.aiCodeAnalysis.vulnerabilities.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="mb-3 text-red-600 dark:text-red-400">Vulnerabilities</h4>
                  <ul className="space-y-2">
                    {submission.aiCodeAnalysis.vulnerabilities.map((vulnerability, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertCircle className="size-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <span>{vulnerability}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {submission.files && submission.files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Attached Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {submission.files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <File className="size-5 text-muted-foreground" />
                    <div>
                      <p>{file.name}</p>
                      <p className="text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDownloadFile(file)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Download className="size-4" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {submission.code && (
        <Card className="border-2 shadow-sm">
          <CardHeader>
            <CardTitle>Submitted Code</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
              <code>{submission.code}</code>
            </pre>
          </CardContent>
        </Card>
      )}

      {submission.aiTestResults && (
        <>
          {submission.aiTestResults.issues.length > 0 && (
            <Card className="border-2 border-yellow-200 dark:border-yellow-900 shadow-sm bg-yellow-50/50 dark:bg-yellow-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="size-5 text-yellow-600" />
                  AI-Detected Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {submission.aiTestResults.issues.map((issue, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-yellow-600 dark:text-yellow-400">•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card className="border-2 shadow-sm">
            <CardHeader>
              <CardTitle>AI Generated Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {submission.aiTestResults.tests.map((test, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {test.status === 'passed' ? (
                        <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="size-5 text-red-600 dark:text-red-400" />
                      )}
                      <span>{test.testName}</span>
                    </div>
                    <Badge variant="outline">{test.duration}ms</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {submission.leadComments && (
        <Card>
          <CardHeader>
            <CardTitle>Project Lead Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{submission.leadComments}</p>
          </CardContent>
        </Card>
      )}

      {submission.reviewComments && (
        <Card>
          <CardHeader>
            <CardTitle>Review Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{submission.reviewComments}</p>
          </CardContent>
        </Card>
      )}

      {!submission.aiTestResults && (
        <Card className="border-2 border-yellow-200 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-yellow-600" />
              No AI Tests Run
            </CardTitle>
            <CardDescription>
              This submission was not tested with AI automated testing before submission
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Developers are encouraged to run AI automated tests before submitting code for review.
            </p>
          </CardContent>
        </Card>
      )}

      {(userRole === 'lead' || userRole === 'reviewer') &&
        (submission.status === 'submitted' || submission.status === 'lead-review' || submission.status === 'user-review' || submission.status === 'ai-testing') && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Decision</CardTitle>
              <CardDescription>Add your comments and approve or reject this submission</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label>Comments</label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Enter your review comments..."
                  rows={4}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => onApprove?.(submission.id, comments)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Approve
                </Button>
                <Button
                  onClick={() => onReject?.(submission.id, comments)}
                  variant="destructive"
                  className="flex-1"
                >
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
