import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

type AITestResultsPageProps = {
  aiTestResults: {
    test_name: string;
    test_code: string;
    expected_output: string;
    actual_output: string;
    status: string;
    error_message?: string;
    description?: string;
  }[];
  onBack: () => void;
};

export function AITestResultsPage({ aiTestResults, onBack }: AITestResultsPageProps) {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="ghost" size="icon">
          <ArrowLeft className="size-4" />
        </Button>
        <h2 className="text-2xl font-bold">AI Test Results</h2>
      </div>

      <div className="grid gap-4">
        {aiTestResults.map((test, index) => (
          <Card key={index} className="border-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {test.status === 'passed' ? (
                  <CheckCircle2 className="size-5 text-green-600" />
                ) : (
                  <XCircle className="size-5 text-red-600" />
                )}
                {test.test_name}
              </CardTitle>
              <Badge variant={test.status === 'passed' ? 'success' : 'destructive'}>
                {test.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Test Code:</h4>
                <pre className="bg-muted p-3 rounded-lg overflow-x-auto">
                  <code>{test.test_code}</code>
                </pre>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Expected Output:</h4>
                <pre className="bg-muted p-3 rounded-lg overflow-x-auto">
                  <code>{test.expected_output}</code>
                </pre>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Actual Output:</h4>
                <pre className="bg-muted p-3 rounded-lg overflow-x-auto">
                  <code>{test.actual_output}</code>
                </pre>
              </div>
              {test.error_message && (
                <div>
                  <h4 className="font-semibold mb-2 text-red-600">Error Message:</h4>
                  <pre className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg overflow-x-auto text-red-600 dark:text-red-400">
                    <code>{test.error_message}</code>
                  </pre>
                </div>
              )}
              {test.description && (
                <div>
                  <h4 className="font-semibold mb-2">Description:</h4>
                  <p className="text-muted-foreground">{test.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}