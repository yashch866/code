import React from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { ArrowLeft } from 'lucide-react';
import { Separator } from './ui/separator';

interface TestCase {
  test_name: string;
  test_code: string;
  expected_output: string;
  actual_output: string;
  status: string;
  description?: string;
  error_message?: string;
  quality_score?: number;
}

interface AITestResultsPageProps {
  aiTestResults: TestCase[];
  onBack: () => void;
}

export const AITestResultsPage: React.FC<AITestResultsPageProps> = ({ aiTestResults, onBack }) => {
  // Group tests by function name
  const functions: Record<string, { code: string; tests: TestCase[] }> = {};
  
  aiTestResults.forEach(test => {
    // Extract function name from test name (format: "Test function_name: description")
    const functionName = test.test_name.split(':')[0].replace('Test ', '').trim();
    
    // Initialize function entry if not exists
    if (!functions[functionName]) {
      // Extract function code more precisely
      const codeMatch = test.test_code.match(/def.*?(?=result\s*=|$)/s);
      const functionCode = codeMatch ? codeMatch[0].trim() : test.test_code.split('result =')[0].trim();
      
      functions[functionName] = {
        code: functionCode,
        tests: []
      };
    }
    
    // Add test details
    functions[functionName].tests.push(test);
  });

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Submission
        </Button>
        <h1 className="text-2xl font-bold">Test Results</h1>
      </div>

      <div className="grid gap-8">
        {Object.entries(functions).map(([functionName, data]) => (
          <Card key={functionName} className="overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-900 p-6 border-b">
              <h3 className="text-xl font-semibold mb-4">Function: {functionName}</h3>
              <div className="bg-[#1e1e1e] text-white rounded-lg p-6 font-mono text-sm overflow-x-auto">
                <pre className="whitespace-pre-wrap">
                  <code>{data.code}</code>
                </pre>
              </div>
            </div>

            <div className="p-6">
              <h4 className="text-lg font-medium mb-4">Test Cases</h4>
              <Accordion type="single" collapsible className="w-full space-y-2">
                {data.tests.map((test, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`${functionName}-${index}`}
                    className={`border rounded-lg ${
                      test.status === 'passed' 
                        ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-900/20' 
                        : 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-900/20'
                    }`}
                  >
                    <AccordionTrigger 
                      className={`px-4 hover:no-underline ${
                        test.status === 'passed' 
                          ? 'text-green-700 dark:text-green-400 hover:text-green-800' 
                          : 'text-red-700 dark:text-red-400 hover:text-red-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          test.status === 'passed' 
                            ? 'bg-green-500' 
                            : 'bg-red-500'
                        }`} />
                        {test.test_name.split(':')[1]?.trim() || test.test_name}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-4 mt-2">
                        <div>
                          <div className="font-medium mb-2">Test Code:</div>
                          <pre className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg overflow-x-auto">
                            <code>{test.test_code}</code>
                          </pre>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="font-medium mb-2">Expected Output:</div>
                            <pre className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg overflow-x-auto">
                              <code>{test.expected_output}</code>
                            </pre>
                          </div>
                          <div>
                            <div className="font-medium mb-2">Actual Output:</div>
                            <pre className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg overflow-x-auto">
                              <code>{test.actual_output}</code>
                            </pre>
                          </div>
                        </div>
                        {test.description && (
                          <div>
                            <div className="font-medium mb-2">Description:</div>
                            <p className="text-slate-600 dark:text-slate-300">{test.description}</p>
                          </div>
                        )}
                        {test.quality_score !== undefined && (
                          <div>
                            <div className="font-medium mb-2">Quality Score:</div>
                            <p className="text-slate-600 dark:text-slate-300">{(test.quality_score * 100).toFixed(1)}%</p>
                          </div>
                        )}
                        {test.error_message && (
                          <div>
                            <div className="font-medium mb-2 text-red-600">Error Message:</div>
                            <pre className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 p-3 rounded-lg overflow-x-auto border border-red-200 dark:border-red-800">
                              <code>{test.error_message}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AITestResultsPage;