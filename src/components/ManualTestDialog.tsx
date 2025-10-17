import { useState } from 'react';
import { ManualTest } from '../types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { PlayCircle, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

type ManualTestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (test: ManualTest) => void;
  editTest?: ManualTest | null;
};

export function ManualTestDialog({ open, onOpenChange, onSubmit, editTest }: ManualTestDialogProps) {
  const [testData, setTestData] = useState<Partial<ManualTest>>({
    name: editTest?.name || '',
    description: editTest?.description || '',
    testCode: editTest?.testCode || '',
    customInput: editTest?.customInput || '',
    expectedOutput: editTest?.expectedOutput || '',
    status: editTest?.status || 'pending',
  });
  const [useCustomInput, setUseCustomInput] = useState(!!editTest?.customInput);
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'passed' | 'failed' | null;
    actualOutput: string;
  } | null>(editTest?.actualOutput ? { status: editTest.status, actualOutput: editTest.actualOutput } : null);

  const executeCode = async () => {
    if (!testData.testCode) {
      toast.error('Please add test code first');
      return;
    }

    if (useCustomInput && !testData.customInput) {
      toast.error('Please add custom input');
      return;
    }

    if (useCustomInput && !testData.expectedOutput) {
      toast.error('Please add expected output');
      return;
    }

    setIsRunning(true);
    setTestResult(null);

    // Simulate code execution
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // Mock execution - in a real scenario, this would use a sandboxed environment
      let output = '';
      let status: 'passed' | 'failed' = 'passed';

      if (useCustomInput) {
        // Simulate execution with custom input
        output = mockExecuteCode(testData.testCode!, testData.customInput!);
        
        // Compare with expected output
        const normalizedOutput = output.trim().toLowerCase();
        const normalizedExpected = testData.expectedOutput!.trim().toLowerCase();
        
        status = normalizedOutput === normalizedExpected ? 'passed' : 'failed';
      } else {
        // Just run the code without custom input
        output = mockExecuteCode(testData.testCode!, '');
        status = 'passed'; // Assume passed if no validation needed
      }

      setTestResult({ status, actualOutput: output });
      setTestData(prev => ({ ...prev, status, actualOutput: output }));
      
      if (status === 'passed') {
        toast.success('Test passed successfully!');
      } else {
        toast.error('Test failed - output does not match expected result');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Code execution failed';
      setTestResult({ status: 'failed', actualOutput: errorMessage });
      setTestData(prev => ({ ...prev, status: 'failed', actualOutput: errorMessage }));
      toast.error('Code execution error');
    } finally {
      setIsRunning(false);
    }
  };

  const mockExecuteCode = (code: string, input: string): string => {
    // This is a mock execution - in production, use a proper sandboxed environment
    try {
      // Simple pattern matching for common operations
      
      // Check for addition: 3+5, 10+20, etc.
      if (input.match(/^\d+\s*\+\s*\d+$/)) {
        const [a, b] = input.split('+').map(n => parseInt(n.trim()));
        return (a + b).toString();
      }
      
      // Check for subtraction
      if (input.match(/^\d+\s*-\s*\d+$/)) {
        const [a, b] = input.split('-').map(n => parseInt(n.trim()));
        return (a - b).toString();
      }
      
      // Check for multiplication
      if (input.match(/^\d+\s*\*\s*\d+$/)) {
        const [a, b] = input.split('*').map(n => parseInt(n.trim()));
        return (a * b).toString();
      }
      
      // Check for division
      if (input.match(/^\d+\s*\/\s*\d+$/)) {
        const [a, b] = input.split('/').map(n => parseInt(n.trim()));
        if (b === 0) return 'Error: Division by zero';
        return (a / b).toString();
      }

      // Check for string operations
      if (code.toLowerCase().includes('uppercase') || code.toLowerCase().includes('toupper')) {
        return input.toUpperCase();
      }
      
      if (code.toLowerCase().includes('lowercase') || code.toLowerCase().includes('tolower')) {
        return input.toLowerCase();
      }
      
      if (code.toLowerCase().includes('reverse')) {
        return input.split('').reverse().join('');
      }
      
      if (code.toLowerCase().includes('length')) {
        return input.length.toString();
      }

      // For numeric input, try to find a pattern
      if (input && !isNaN(Number(input))) {
        const num = Number(input);
        
        if (code.toLowerCase().includes('square')) {
          return (num * num).toString();
        }
        
        if (code.toLowerCase().includes('double') || code.toLowerCase().includes('*2')) {
          return (num * 2).toString();
        }
        
        if (code.toLowerCase().includes('increment') || code.toLowerCase().includes('+1')) {
          return (num + 1).toString();
        }
      }

      // Default: return the input as-is
      return input || 'Code executed successfully';
    } catch (error) {
      throw new Error('Execution error: Invalid code or input');
    }
  };

  const handleSubmit = () => {
    if (!testData.name?.trim()) {
      toast.error('Please enter a test name');
      return;
    }

    if (!testData.description?.trim()) {
      toast.error('Please enter a test description');
      return;
    }

    if (!testData.testCode?.trim()) {
      toast.error('Please add test code');
      return;
    }

    // If using custom input, require execution
    if (useCustomInput && !testResult) {
      toast.error('Please run the code before submitting');
      return;
    }

    const test: ManualTest = {
      id: editTest?.id || Date.now().toString(),
      name: testData.name!,
      description: testData.description!,
      status: testData.status || 'pending',
      executedAt: new Date().toISOString(),
      testCode: testData.testCode,
      customInput: useCustomInput ? testData.customInput : undefined,
      expectedOutput: useCustomInput ? testData.expectedOutput : undefined,
      actualOutput: testData.actualOutput,
    };

    onSubmit(test);
    onOpenChange(false);
    
    // Reset form
    setTestData({
      name: '',
      description: '',
      testCode: '',
      customInput: '',
      expectedOutput: '',
      status: 'pending',
    });
    setUseCustomInput(false);
    setTestResult(null);
    
    toast.success(editTest ? 'Test updated successfully!' : 'Test added successfully!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#F46F50]/10">
              <PlayCircle className="size-6 text-[#F46F50]" />
            </div>
            <div>
              <DialogTitle className="text-2xl">{editTest ? 'Edit Manual Test' : 'Create New Manual Test'}</DialogTitle>
              <DialogDescription className="text-base mt-1">
                Build interactive tests with custom inputs and automated validation
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Test Details Section */}
          <div className="space-y-4 p-6 rounded-lg border-2 bg-gradient-to-br from-slate-50/50 to-slate-100/30 dark:from-slate-900/30 dark:to-slate-800/20">
            <h3 className="flex items-center gap-2 text-lg">
              <span>📝</span> Test Details
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="test-name" className="text-base">Test Name *</Label>
                <Input
                  id="test-name"
                  value={testData.name}
                  onChange={(e) => setTestData({ ...testData, name: e.target.value })}
                  placeholder="e.g., Test Addition Function"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="test-description" className="text-base">Test Description *</Label>
                <Textarea
                  id="test-description"
                  value={testData.description}
                  onChange={(e) => setTestData({ ...testData, description: e.target.value })}
                  placeholder="e.g., Verify that the addition function correctly adds two numbers"
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </div>

          {/* Test Code Section */}
          <div className="space-y-4 p-6 rounded-lg border-2 bg-gradient-to-br from-purple-50/30 to-blue-50/30 dark:from-purple-950/20 dark:to-blue-950/20">
            <h3 className="flex items-center gap-2 text-lg">
              <span>💻</span> Test Code
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="test-code" className="text-base">Code to Test *</Label>
              <Textarea
                id="test-code"
                value={testData.testCode}
                onChange={(e) => setTestData({ ...testData, testCode: e.target.value })}
                placeholder="// Paste your code here...&#10;function add(a, b) {&#10;  return a + b;&#10;}"
                rows={12}
                className="font-mono text-sm bg-slate-950 text-slate-50 dark:bg-slate-950 dark:text-slate-50 border-slate-700 focus:border-slate-500 resize-none"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                💡 Tip: Write or paste the code you want to test
              </p>
            </div>
          </div>

          {/* Custom Input Toggle */}
          <div className="p-5 border-2 rounded-lg bg-gradient-to-br from-amber-50/40 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/20 hover:shadow-md transition-all">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="use-custom-input"
                checked={useCustomInput}
                onCheckedChange={(checked) => setUseCustomInput(checked as boolean)}
                className="mt-1"
              />
              <label
                htmlFor="use-custom-input"
                className="flex-1 cursor-pointer select-none"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">🎯 Test against custom input</span>
                  <Badge variant="outline" className="text-xs bg-white dark:bg-slate-900">
                    Optional
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enable this to run your code with specific input values and automatically validate the output
                </p>
              </label>
            </div>
          </div>

          {/* Custom Input Fields */}
          {useCustomInput && (
            <div className="space-y-5 p-6 border-2 border-dashed rounded-lg bg-gradient-to-br from-green-50/30 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/20 animate-in fade-in-50 duration-300">
              <h3 className="flex items-center gap-2 text-lg">
                <span>⚙️</span> Input & Expected Output
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-input" className="text-base flex items-center gap-2">
                    <span>📥</span> Custom Input *
                  </Label>
                  <Textarea
                    id="custom-input"
                    value={testData.customInput}
                    onChange={(e) => setTestData({ ...testData, customInput: e.target.value })}
                    placeholder="e.g., 3+5&#10;or&#10;1323243"
                    rows={4}
                    className="font-mono text-sm resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the test input (e.g., function parameters or test data)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expected-output" className="text-base flex items-center gap-2">
                    <span>✅</span> Expected Output *
                  </Label>
                  <Textarea
                    id="expected-output"
                    value={testData.expectedOutput}
                    onChange={(e) => setTestData({ ...testData, expectedOutput: e.target.value })}
                    placeholder="e.g., 8"
                    rows={4}
                    className="font-mono text-sm resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter what your code should return for the given input
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Run Code Button */}
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={executeCode}
              disabled={isRunning || !testData.testCode}
              className="gap-2 h-12 px-8 bg-[#F46F50] hover:bg-[#F46F50]/90 text-white"
              size="lg"
            >
              {isRunning ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Executing Code...
                </>
              ) : (
                <>
                  <PlayCircle className="size-5" />
                  Run Code & Validate
                </>
              )}
            </Button>
          </div>

          {/* Test Result */}
          {testResult && (
            <Alert
              variant={testResult.status === 'passed' ? 'default' : 'destructive'}
              className={`border-2 shadow-lg animate-in fade-in-50 slide-in-from-top-2 duration-300 ${
                testResult.status === 'passed' 
                  ? 'border-green-500 bg-green-50 dark:bg-green-950/30' 
                  : 'border-red-500 bg-red-50 dark:bg-red-950/30'
              }`}
            >
              <div className="flex items-start gap-4 p-2">
                {testResult.status === 'passed' ? (
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                    <CheckCircle2 className="size-6 text-green-600 dark:text-green-400" />
                  </div>
                ) : (
                  <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
                    <XCircle className="size-6 text-red-600 dark:text-red-400" />
                  </div>
                )}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-lg ${testResult.status === 'passed' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                      Test {testResult.status === 'passed' ? 'Passed ✓' : 'Failed ✗'}
                    </span>
                    <Badge 
                      variant={testResult.status === 'passed' ? 'default' : 'destructive'}
                      className="px-3 py-1"
                    >
                      {testResult.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  {useCustomInput && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Expected Output:</div>
                        <div className="font-mono text-sm bg-white dark:bg-slate-900 p-3 rounded border">
                          {testData.expectedOutput}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Actual Output:</div>
                        <div className={`font-mono text-sm p-3 rounded border ${
                          testResult.status === 'passed' 
                            ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700' 
                            : 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700'
                        }`}>
                          {testResult.actualOutput}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!useCustomInput && testResult.actualOutput && (
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Output:</div>
                      <AlertDescription className="font-mono text-sm bg-white dark:bg-slate-900 p-3 rounded border">
                        {testResult.actualOutput}
                      </AlertDescription>
                    </div>
                  )}
                </div>
              </div>
            </Alert>
          )}

          {/* Info Alert */}
          {!testResult && useCustomInput && (
            <Alert className="border-blue-300 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
              <AlertCircle className="size-5 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-sm">
                💡 Click "Run Code & Validate" to test your code with the custom input before submitting
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Dialog Actions */}
        <div className="flex justify-between items-center gap-3 pt-6 border-t">
          <p className="text-sm text-muted-foreground">
            * Required fields
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => {
                onOpenChange(false);
                setTestData({
                  name: '',
                  description: '',
                  testCode: '',
                  customInput: '',
                  expectedOutput: '',
                  status: 'pending',
                });
                setUseCustomInput(false);
                setTestResult(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              className="gap-2 bg-[#F46F50] hover:bg-[#F46F50]/90 text-white px-8"
              size="lg"
            >
              <CheckCircle2 className="size-5" />
              {editTest ? 'Update Test' : 'Add Test'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
