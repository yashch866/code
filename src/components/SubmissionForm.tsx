import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Submission, FileAttachment, ManualTest, Project, User, AICodeAnalysis } from '../types';
import { Upload, X, File, Plus, CheckCircle, XCircle, Sparkles, PlayCircle, Loader2, TrendingUp, Shield, Zap, AlertTriangle, Eye } from 'lucide-react';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { runAITests, generateCodeAnalysis, generateTestCases } from '../tests/mocks/ai-test-generator';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { cn } from './ui/utils';
import { submissionsApi, aiTestsApi } from '../services/api';
import { AITestResultsPage } from './AITestResultsPage';

type SubmissionFormProps = {
  projects: Project[];
  currentUser: User;
  onSubmit: (submission: Omit<Submission, 'id' | 'submittedDate' | 'status' | 'developerId' | 'assignedTo'>) => void;
};

export function SubmissionForm({ projects, currentUser, onSubmit }: SubmissionFormProps) {
  const [formData, setFormData] = useState({
    projectId: '',
    description: '',
    code: '',
  });
  const [submissionType, setSubmissionType] = useState<'code' | 'attachments'>('code');
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [manualTests, setManualTests] = useState<ManualTest[]>([{
    id: Date.now().toString(),
    name: '',
    description: '',
    status: 'passed',
    testCode: '',
    input: '',
    expectedOutput: '',
    actualOutput: ''
  }]);
  const [isRunningAITests, setIsRunningAITests] = useState(false);
  const [aiTestResults, setAITestResults] = useState<Submission['aiTestResults'] | null>(null);
  const [aiCodeAnalysis, setAICodeAnalysis] = useState<AICodeAnalysis | null>(null);
  const [showAIResults, setShowAIResults] = useState(false);
  const [aiDetailedResults, setAiDetailedResults] = useState([]);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [isShowingLogs, setIsShowingLogs] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    Array.from(selectedFiles).forEach((selectedFile: unknown) => {
      if (!(selectedFile instanceof File)) return;
      
      const file = selectedFile as File;
      const reader = new FileReader();
      
      reader.onload = (event: ProgressEvent<FileReader>) => {
        if (!event.target?.result) return;
        
        const fileData: FileAttachment = {
          name: file.name,
          size: file.size,
          type: file.type,
          content: event.target.result.toString(),
        };
        setFiles((prev) => [...prev, fileData]);
      };
      
      reader.readAsDataURL(file);
    });
    
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleTestSubmit = (test: ManualTest) => {
    setManualTests(prev => [...prev, test]);
  };

  const removeTest = (id: string) => {
    setManualTests(prev => prev.filter(test => test.id !== id));
  };

  const handleViewResults = () => {
    setShowAIResults(true);
  };

  const handleRunAITests = async () => {
    if (submissionType === 'code' && !formData.code) {
      toast.error('Please add code before running AI tests');
      return;
    }

    if (submissionType === 'attachments' && files.length === 0) {
      toast.error('Please upload files before running AI tests');
      return;
    }

    setIsRunningAITests(true);
    setTestLogs([]);
    setIsShowingLogs(true);
    
    try {
      const codeToTest = submissionType === 'code' ? formData.code : files.map(f => f.content).join('\n');
      
      // Run AI tests and process the streamed response
      const response = await fetch('http://localhost:8000/api/run-ai-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code: codeToTest,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Process the streaming response
      const reader = response.body?.getReader();
      let testResults: any[] = [];
      
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Convert the received chunks to text and split into lines
        const text = new TextDecoder().decode(value);
        const lines = text.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            // Remove the "data: " prefix if it exists
            const jsonStr = line.replace(/^data:\s*/, '').trim();
            if (jsonStr) {
              const data = JSON.parse(jsonStr);
              if (data.message) {
                // Progress message
                setTestLogs(prev => [...prev, data.message]);
              } else {
                // Test result
                testResults.push(data);
              }
            }
          } catch (e) {
            console.debug('Failed to parse line:', line);
          }
        }
      }

      // Process the final test results
      if (testResults.length === 0) {
        throw new Error('No test results received');
      }

      const total = testResults.length;
      const passed = testResults.filter(t => t.status === 'passed').length;
      const failed = total - passed;
      const coverage = Math.round((passed / total) * 100);
      const issues = testResults
        .filter(t => t.error_message)
        .map(t => t.error_message);

      const formattedResults = {
        total,
        passed,
        failed,
        coverage,
        issues,
        tests: testResults.map(test => ({
          testName: test.test_name,
          status: test.status,
          duration: test.duration || 45,
          description: test.description
        }))
      };

      setAITestResults(formattedResults);
      setAiDetailedResults(testResults);
      setAICodeAnalysis({
        securityScore: Math.round((passed / total) * 100),
        performanceScore: Math.round((passed / total) * 100),
        maintainabilityScore: Math.round((passed / total) * 100)
      });

      toast.success('AI automated tests completed!', {
        description: `${passed}/${total} tests passed. Click View Results for details.`,
      });
    } catch (error) {
      console.error('Failed to run AI tests:', error);
      toast.error('Failed to run AI tests', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
      setAITestResults(null);
      setAiDetailedResults([]);
      setAICodeAnalysis(null);
    } finally {
      setIsRunningAITests(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectId) {
      toast.error('Please select a project');
      return;
    }

    if (!formData.code.trim()) {
      toast.error('Please paste your code');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    try {
      const submissionData = {
        project_id: formData.projectId,
        developer_id: currentUser.id.toString(),
        code: formData.code,
        description: formData.description,
        manual_tests: manualTests.map(test => ({
          name: test.name,
          description: test.description,
          status: test.status
        })),
        ai_test_results: aiDetailedResults ? aiDetailedResults.map(test => ({
          test_name: String(test.test_name).slice(0, 255),
          test_code: String(test.test_code),
          expected_output: String(test.expected_output),
          actual_output: String(test.actual_output),
          status: String(test.status),
          error_message: test.error_message ? String(test.error_message) : undefined
        })) : []
      };

      const response = await submissionsApi.create(submissionData);

      const project = projects.find(p => p.id.toString() === formData.projectId);
      
      onSubmit({
        projectId: formData.projectId,
        projectName: project?.name || 'Unknown Project',
        developerName: currentUser.name,
        code: formData.code,
        description: formData.description,
        manualTests: manualTests
      });
      
      setFormData({
        projectId: '',
        description: '',
        code: '',
      });
      setManualTests([]);
      setAITestResults(null);
      setAICodeAnalysis(null);
      setAiDetailedResults([]);
      
      toast.success('Code and tests submitted successfully!');
    } catch (error) {
      console.error('Error submitting code:', error);
      toast.error('Failed to submit code. Please try again.');
    }
  };

  const addNewTest = () => {
    setManualTests(prev => [...prev, {
      id: Date.now().toString(),
      name: '',
      description: '',
      status: 'passed',
      testCode: '',
      input: '',
      expectedOutput: '',
      actualOutput: ''
    }]);
  };

  const updateTest = (id: string, updates: Partial<ManualTest>) => {
    setManualTests(prev => prev.map(test => 
      test.id === id ? { ...test, ...updates } : test
    ));
  };

  const executeTestCode = (code: string, input: string) => {
    try {
      const testFunc = new Function('input', `
        try {
          ${code}
          return { success: true, output: eval(input) };
        } catch (error) {
          return { success: false, output: error.message };
        }
      `);
      
      const result = testFunc(input);
      return result.success ? String(result.output) : `Error: ${result.output}`;
    } catch (error) {
      return `Error: ${error.message}`;
    }
  };

  const validateTest = (id: string) => {
    const test = manualTests.find(t => t.id === id);
    if (test && test.testCode && test.input) {
      const actualOutput = executeTestCode(test.testCode, test.input);
      updateTest(id, { 
        actualOutput, 
        status: actualOutput.trim() === test.expectedOutput?.trim() ? 'passed' : 'failed' 
      });
    }
  };

  if (showAIResults && aiDetailedResults.length > 0) {
    return (
      <AITestResultsPage 
        aiTestResults={aiDetailedResults}
        onBack={() => setShowAIResults(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 shadow-sm">
        <CardHeader>
          <CardTitle>Submit Code for Review</CardTitle>
          <CardDescription>
            Submit your code along with manual and AI test results for project lead review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="projectId">Select Project</Label>
              <Select
                value={formData.projectId.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}
              >
                <SelectTrigger id="projectId">
                  <SelectValue placeholder="Choose a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this code does and any important notes"
                rows={3}
                required
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Submission Type</Label>
              <RadioGroup
                value={submissionType}
                onValueChange={(value: 'code' | 'attachments') => setSubmissionType(value)}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <label
                  htmlFor="type-code"
                  className={cn(
                    "relative flex flex-col items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all hover:bg-accent/50",
                    submissionType === 'code'
                      ? "border-[#F46F50] bg-[#F46F50]/5"
                      : "border-border hover:border-[#F46F50]/50"
                  )}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "rounded-full p-2 transition-colors",
                          submissionType === 'code'
                            ? "bg-[#F46F50] text-white"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <File className="size-5" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Paste Code Text</span>
                          {submissionType === 'code' && (
                            <CheckCircle className="size-4 text-[#F46F50]" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Write or paste your code directly
                        </span>
                      </div>
                    </div>
                  </div>
                  <RadioGroupItem value="code" id="type-code" className="sr-only" />
                </label>

                <label
                  htmlFor="type-attachments"
                  className={cn(
                    "relative flex flex-col items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all hover:bg-accent/50",
                    submissionType === 'attachments'
                      ? "border-[#F46F50] bg-[#F46F50]/5"
                      : "border-border hover:border-[#F46F50]/50"
                  )}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "rounded-full p-2 transition-colors",
                          submissionType === 'attachments'
                            ? "bg-[#F46F50] text-white"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <Upload className="size-5" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Upload File Attachments</span>
                          {submissionType === 'attachments' && (
                            <CheckCircle className="size-4 text-[#F46F50]" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Upload files from your computer
                        </span>
                      </div>
                    </div>
                  </div>
                  <RadioGroupItem value="attachments" id="type-attachments" className="sr-only" />
                </label>
              </RadioGroup>
            </div>

            {submissionType === 'code' && (
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Textarea
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Paste your code here"
                  rows={12}
                  className="font-mono"
                  required
                />
              </div>
            )}

            {submissionType === 'attachments' && (
              <div className="space-y-2">
                <Label>File Attachments</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      id="fileUpload"
                      type="file"
                      onChange={handleFileChange}
                      multiple
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('fileUpload')?.click()}
                      className="w-full gap-2"
                    >
                      <Upload className="size-4" />
                      Upload Files
                    </Button>
                  </div>
                  
                  {files.length > 0 && (
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <File className="size-4 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="truncate">{file.name}</p>
                              <p className="text-muted-foreground">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(index)}
                            className="flex-shrink-0"
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Manual Tests</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addNewTest}
                  className="gap-2"
                >
                  <Plus className="size-4" />
                  Add Another Test
                </Button>
              </div>

              <div className="space-y-6">
                {manualTests.map((test, index) => (
                  <div key={test.id} className="p-4 border-2 rounded-lg space-y-4 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Test #{index + 1}</span>
                      {manualTests.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTest(test.id)}
                        >
                          <X className="size-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`test-name-${test.id}`}>Test Name</Label>
                        <Input
                          id={`test-name-${test.id}`}
                          value={test.name}
                          onChange={(e) => updateTest(test.id, { name: e.target.value })}
                          placeholder="e.g., Validate Input Format"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`test-description-${test.id}`}>Description</Label>
                        <Textarea
                          id={`test-description-${test.id}`}
                          value={test.description}
                          onChange={(e) => updateTest(test.id, { description: e.target.value })}
                          placeholder="Describe what this test validates"
                          rows={2}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`test-code-${test.id}`}>Test Code *</Label>
                        <Textarea
                          id={`test-code-${test.id}`}
                          value={test.testCode}
                          onChange={(e) => updateTest(test.id, { testCode: e.target.value })}
                          placeholder="// Paste your code here...&#10;function add(a, b) {&#10;  return a + b;&#10;}"
                          rows={8}
                          className="font-mono text-sm"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          💡 Tip: Write or paste the code you want to test
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`test-input-${test.id}`}>Test Input</Label>
                          <Input
                            id={`test-input-${test.id}`}
                            value={test.input}
                            onChange={(e) => updateTest(test.id, { input: e.target.value })}
                            placeholder="e.g., add(3, 5)"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`expected-output-${test.id}`}>Expected Output</Label>
                          <Input
                            id={`expected-output-${test.id}`}
                            value={test.expectedOutput}
                            onChange={(e) => updateTest(test.id, { expectedOutput: e.target.value })}
                            placeholder="e.g., 8"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`actual-output-${test.id}`}>Actual Output</Label>
                        <div className="flex gap-2">
                          <Input
                            id={`actual-output-${test.id}`}
                            value={test.actualOutput}
                            readOnly
                            className="bg-muted"
                            placeholder="Output will appear here after running the test"
                          />
                          <Button
                            type="button"
                            onClick={() => validateTest(test.id)}
                            variant="outline"
                            className="gap-2 whitespace-nowrap"
                          >
                            <PlayCircle className="size-4" />
                            Run Test
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Label>Status:</Label>
                        <Badge variant={test.status === 'passed' ? 'default' : 'destructive'}>
                          {test.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {manualTests.length > 0 && (
                <div className="flex items-center gap-4 p-3 bg-muted rounded-lg border">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="size-4 text-green-600" />
                    <span>Passed: {manualTests.filter((t) => t.status === 'passed').length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="size-4 text-red-600" />
                    <span>Failed: {manualTests.filter((t) => t.status === 'failed').length}</span>
                  </div>
                  <div className="ml-auto">
                    Total: {manualTests.length}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-4 p-6 rounded-lg bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 border-2">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-purple-600" />
                <h3>AI Automated Testing & Code Analysis</h3>
              </div>
              <p className="text-muted-foreground">
                Run comprehensive AI-powered tests and code analysis (Required before submission)
              </p>

              <Alert>
                <AlertTriangle className="size-4" />
                <AlertDescription>
                  AI automated testing is required before submitting your code. This helps identify potential issues early.
                </AlertDescription>
              </Alert>

              <Button
                type="button"
                onClick={handleRunAITests}
                disabled={isRunningAITests || 
                  (submissionType === 'code' && !formData.code.trim()) || 
                  (submissionType === 'attachments' && files.length === 0)}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white gap-2"
                size="lg"
              >
                {isRunningAITests ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Running AI Tests...
                  </>
                ) : (
                  <>
                    <PlayCircle className="size-5" />
                    Run AI Automated Tests
                  </>
                )}
              </Button>

              {isShowingLogs && (
                <div className="mt-4 p-4 bg-black text-green-400 font-mono text-sm rounded-lg h-96 overflow-auto">
                  {testLogs.map((log, index) => (
                    <div key={index} className="whitespace-pre-wrap">
                      {log}
                    </div>
                  ))}
                </div>
              )}

              {aiDetailedResults && aiDetailedResults.length > 0 && aiTestResults && aiCodeAnalysis && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="size-5 text-green-600" />
                      <h4>AI Test Results</h4>
                    </div>
                    <Button 
                      onClick={() => setShowAIResults(true)}
                      variant="outline"
                      className="gap-2"
                    >
                      <Eye className="size-4" />
                      View Results
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-2">
                      <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                          <div className="text-3xl text-green-600">
                            {aiTestResults.passed}/{aiTestResults.total}
                          </div>
                          <p className="text-muted-foreground">Tests Passed</p>
                          <Progress value={(aiTestResults.passed / aiTestResults.total) * 100} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-2">
                      <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                          <div className="text-3xl text-blue-600">
                            {aiTestResults.coverage}%
                          </div>
                          <p className="text-muted-foreground">Code Coverage</p>
                          <Progress value={aiTestResults.coverage} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-2">
                      <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                          <div className="text-3xl text-orange-600">
                            {aiTestResults.issues.length}
                          </div>
                          <p className="text-muted-foreground">Issues Found</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-card rounded-lg border">
                      <Shield className="size-8 text-blue-600" />
                      <div>
                        <div className="text-xl">{aiCodeAnalysis.securityScore}%</div>
                        <p className="text-muted-foreground">Security</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-card rounded-lg border">
                      <Zap className="size-8 text-yellow-600" />
                      <div>
                        <div className="text-xl">{aiCodeAnalysis.performanceScore}%</div>
                        <p className="text-muted-foreground">Performance</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-card rounded-lg border">
                      <TrendingUp className="size-8 text-green-600" />
                      <div>
                        <div className="text-xl">{aiCodeAnalysis.maintainabilityScore}%</div>
                        <p className="text-muted-foreground">Maintainability</p>
                      </div>
                    </div>
                  </div>

                  {aiTestResults.issues.length > 0 && (
                    <div className="space-y-2">
                      <h4>Issues to Address:</h4>
                      <div className="space-y-2">
                        {aiTestResults.issues.map((issue, index) => (
                          <Alert key={index} variant="destructive">
                            <AlertDescription>{issue}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}

                  <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                    <CheckCircle className="size-3 mr-1" />
                    AI tests completed - Ready to submit
                  </Badge>
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#F46F50] hover:bg-[#e05a3d] text-white" 
              size="lg"
              disabled={!aiTestResults || !aiCodeAnalysis}
            >
              Submit Code for Review
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}