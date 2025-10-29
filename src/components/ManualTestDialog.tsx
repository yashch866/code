import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { ManualTest } from '../types';
import { PlayCircle, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface ManualTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (test: ManualTest) => void;
  editTest?: ManualTest | null;
}

export function ManualTestDialog({ open, onOpenChange, onSubmit, editTest }: ManualTestDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    input: '',
    expectedOutput: '',
    actualOutput: '',
  });
  const [status, setStatus] = useState<'passed' | 'failed'>('passed');
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    if (editTest) {
      setFormData({
        name: editTest.name,
        description: editTest.description,
        input: editTest.input || '',
        expectedOutput: editTest.expectedOutput || '',
        actualOutput: editTest.actualOutput || '',
      });
      setStatus(editTest.status);
      setHasRun(true);
    } else {
      setFormData({
        name: '',
        description: '',
        input: '',
        expectedOutput: '',
        actualOutput: '',
      });
      setStatus('passed');
      setHasRun(false);
    }
  }, [editTest, open]);

  const handleRunTest = () => {
    // Simulate running the test
    const testPassed = formData.actualOutput.trim() === formData.expectedOutput.trim();
    setStatus(testPassed ? 'passed' : 'failed');
    setHasRun(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const test: ManualTest = {
      id: editTest?.id || Date.now().toString(),
      name: formData.name,
      description: formData.description,
      status,
      input: formData.input,
      expectedOutput: formData.expectedOutput,
      actualOutput: formData.actualOutput,
    };

    onSubmit(test);
    onOpenChange(false);
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      input: '',
      expectedOutput: '',
      actualOutput: '',
    });
    setStatus('passed');
    setHasRun(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editTest ? 'Edit Manual Test' : 'Add Manual Test'}</DialogTitle>
          <DialogDescription>
            Create a manual test case with inputs and expected outputs
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-name">Test Name *</Label>
            <Input
              id="test-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Test Addition Function"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-description">Description *</Label>
            <Textarea
              id="test-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this test validates"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
                        <Label htmlFor={`test-code-${test.id}`}>Test Code *</Label>
                        <Textarea
                          id={`test-code-${test.id}`}
                          value={test.testCode}
                          onChange={(e) => updateManualTest(test.id, { testCode: e.target.value })}
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
              <Label htmlFor="test-input">Test Input</Label>
              <Input
                id="test-input"
                value={formData.input}
                onChange={(e) => setFormData({ ...formData, input: e.target.value })}
                placeholder="e.g., 3, 5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected-output">Expected Output</Label>
              <Input
                id="expected-output"
                value={formData.expectedOutput}
                onChange={(e) => setFormData({ ...formData, expectedOutput: e.target.value })}
                placeholder="e.g., 8"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="actual-output">Actual Output</Label>
            <Input
              id="actual-output"
              value={formData.actualOutput}
              onChange={(e) => setFormData({ ...formData, actualOutput: e.target.value })}
              placeholder="Enter the actual result from running the test"
            />
          </div>

          {formData.expectedOutput && formData.actualOutput && (
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleRunTest}
                variant="outline"
                className="gap-2"
              >
                <PlayCircle className="size-4" />
                Validate Test
              </Button>
            </div>
          )}

          {hasRun && (
            <Alert className={status === 'passed' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
              <div className="flex items-center gap-2">
                {status === 'passed' ? (
                  <>
                    <CheckCircle className="size-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Test Passed - Expected output matches actual output
                    </AlertDescription>
                  </>
                ) : (
                  <>
                    <XCircle className="size-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      Test Failed - Expected output does not match actual output
                    </AlertDescription>
                  </>
                )}
              </div>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Test Status *</Label>
            <RadioGroup value={status} onValueChange={(value: 'passed' | 'failed') => setStatus(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="passed" id="status-passed" />
                <Label htmlFor="status-passed" className="cursor-pointer">Passed</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="failed" id="status-failed" />
                <Label htmlFor="status-failed" className="cursor-pointer">Failed</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-[#F46F50] hover:bg-[#e05a3d]">
              {editTest ? 'Update Test' : 'Add Test'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
