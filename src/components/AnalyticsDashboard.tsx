import { Submission } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, CheckCircle, XCircle, Clock, Code, BarChart3 } from 'lucide-react';

type AnalyticsDashboardProps = {
  submissions: Submission[];
};

export function AnalyticsDashboard({ submissions }: AnalyticsDashboardProps) {
  // Check if there's any data
  if (submissions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2>Analytics Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Overview of submission metrics and performance
          </p>
        </div>

        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="size-16 text-muted-foreground mb-4" />
            <h3 className="text-xl mb-2">No Data Available</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Analytics will be displayed once code submissions are made. Submit your first code to start tracking performance metrics, approval rates, and team productivity.
            </p>
            <div className="grid grid-cols-2 gap-4 w-full max-w-lg text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Code className="size-4 text-muted-foreground" />
                  <span className="font-medium">Track Submissions</span>
                </div>
                <p className="text-muted-foreground text-xs">Monitor all code submissions</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="size-4 text-muted-foreground" />
                  <span className="font-medium">Approval Rates</span>
                </div>
                <p className="text-muted-foreground text-xs">View approval statistics</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="size-4 text-muted-foreground" />
                  <span className="font-medium">Test Performance</span>
                </div>
                <p className="text-muted-foreground text-xs">Analyze test pass rates</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="size-4 text-muted-foreground" />
                  <span className="font-medium">Project Insights</span>
                </div>
                <p className="text-muted-foreground text-xs">Compare project activity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  // Calculate statistics
  const totalSubmissions = submissions.length;
  const approvedCount = submissions.filter((s) => s.status === 'approved').length;
  const rejectedCount = submissions.filter((s) => s.status === 'rejected').length;
  const pendingCount = submissions.filter(
    (s) => !['approved', 'rejected'].includes(s.status)
  ).length;

  const approvalRate = totalSubmissions > 0 ? Math.round((approvedCount / totalSubmissions) * 100) : 0;

  // Test pass rates
  const avgManualPassRate =
    submissions.length > 0 && submissions.every(s => s.manualTests?.length > 0)
      ? Math.round(
          submissions.reduce((sum, s) => {
            const passRate = (s.manualTests?.filter(t => t.status === 'passed').length ?? 0) / (s.manualTests?.length ?? 1) * 100;
            return sum + passRate;
          }, 0) / submissions.length
        )
      : 0;

  const avgAIPassRate =
    submissions.filter((s) => s.aiTestResults).length > 0
      ? Math.round(
          submissions
            .filter((s) => s.aiTestResults)
            .reduce((sum, s) => sum + ((s.aiTestResults?.passed ?? 0) / (s.aiTestResults?.total ?? 1)) * 100, 0) /
            submissions.filter((s) => s.aiTestResults).length
        )
      : 0;

  // Status distribution data
  const statusData = [
    { name: 'Approved', value: approvedCount, color: '#22c55e' },
    { name: 'Rejected', value: rejectedCount, color: '#ef4444' },
    { name: 'Pending', value: pendingCount, color: '#3b82f6' },
  ];

  // Submissions by project
  const projectData = Object.entries(
    submissions.reduce((acc, s) => {
      acc[s.projectName] = (acc[s.projectName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Submissions over time (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const timelineData = last7Days.map((date) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: submissions.filter((s) => s.submittedDate.split('T')[0] === date).length,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2>Analytics Dashboard</h2>
        <p className="text-muted-foreground mt-1">
          Overview of submission metrics and performance
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Code className="size-4" />
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{totalSubmissions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="size-4" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{approvedCount}</div>
            <p className="text-muted-foreground mt-1">{approvalRate}% approval rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <XCircle className="size-4" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{rejectedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Clock className="size-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{pendingCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Submissions by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={projectData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Timeline and Test Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Submissions Timeline (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span>Average Manual Test Pass Rate</span>
                <span className="text-green-600 dark:text-green-400">{avgManualPassRate}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 dark:bg-green-400 transition-all"
                  style={{ width: `${avgManualPassRate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span>Average AI Test Pass Rate</span>
                <span className="text-blue-600 dark:text-blue-400">{avgAIPassRate}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 dark:bg-blue-400 transition-all"
                  style={{ width: `${avgAIPassRate}%` }}
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-5 text-green-600 dark:text-green-400" />
                <span>Code quality is improving over time</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
