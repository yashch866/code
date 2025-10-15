import { useState } from 'react';
import { Submission } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Download, Search, FolderOpen, File } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

type ProjectsArchiveProps = {
  submissions: Submission[];
  onViewSubmission: (submission: Submission) => void;
};

export function ProjectsArchive({ submissions, onViewSubmission }: ProjectsArchiveProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Group submissions by project name
  const projectGroups = submissions.reduce((acc, submission) => {
    if (!acc[submission.projectName]) {
      acc[submission.projectName] = [];
    }
    acc[submission.projectName].push(submission);
    return acc;
  }, {} as Record<string, Submission[]>);

  const filteredProjects = Object.entries(projectGroups).filter(([projectName]) =>
    projectName.toLowerCase().includes(searchQuery.toLowerCase())
  );



  const handleDownloadFile = (file: { name: string; content: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const getStatusColor = (status: Submission['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'rejected':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default:
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2>Project Archive</h2>
        <p className="text-muted-foreground mt-1">
          Browse and download code from all organization projects
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search projects..."
          className="pl-10"
        />
      </div>

      <div className="grid gap-6">
        {submissions.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FolderOpen className="size-16 text-muted-foreground mb-4" />
              <h3 className="text-xl mb-2">No Projects Available</h3>
              <p className="text-muted-foreground text-center max-w-md">
                The archive is empty. Projects will appear here once code submissions are made and processed through the review workflow.
              </p>
            </CardContent>
          </Card>
        ) : filteredProjects.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Search className="size-16 text-muted-foreground mb-4" />
              <h3 className="text-xl mb-2">No Projects Found</h3>
              <p className="text-muted-foreground text-center max-w-md">
                No projects match your search query. Try adjusting your search terms.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredProjects.map(([projectName, projectSubmissions]) => (
            <Card key={projectName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="size-5" />
                  {projectName}
                  <Badge variant="outline" className="ml-2">
                    {projectSubmissions.length} submission{projectSubmissions.length !== 1 ? 's' : ''}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {projectSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{submission.developerName}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                              {formatDate(submission.submittedDate)}
                            </span>
                            <Badge className={getStatusColor(submission.status)}>
                              {submission.status}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">{submission.description}</p>
                          
                          {submission.files && submission.files.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              {submission.files.map((file, idx) => (
                                <Button
                                  key={idx}
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => handleDownloadFile(file, e)}
                                  className="gap-2"
                                >
                                  <File className="size-3" />
                                  {file.name}
                                  <Download className="size-3" />
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewSubmission(submission)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
