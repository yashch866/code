import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Code2, Lock, User, Mail } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

type LoginScreenProps = {
  onLogin: (username: string, password: string) => Promise<boolean>;
  onSignUp: (username: string, password: string, name: string, email: string) => boolean;
};

export function LoginScreen({ onLogin, onSignUp }: LoginScreenProps) {
  // Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Sign up state
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpError, setSignUpError] = useState('');
  const [signUpSuccess, setSignUpSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    try {
      console.log('Attempting login with:', username);
      const success = await onLogin(username.trim(), password);
      if (!success) {
        console.log('Login failed');
        setError('Invalid username or password');
        setPassword('');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error?.response?.data?.detail || 'Login failed. Please try again.');
      setPassword('');
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError('');
    setSignUpSuccess('');

    // Validation
    if (!signUpUsername.trim() || !signUpPassword.trim() || !signUpName.trim() || !signUpEmail.trim()) {
      setSignUpError('Please fill in all fields');
      return;
    }

    if (signUpPassword.length < 6) {
      setSignUpError('Password must be at least 6 characters long');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signUpEmail)) {
      setSignUpError('Please enter a valid email address');
      return;
    }

    const success = onSignUp(
      signUpUsername.trim(),
      signUpPassword,
      signUpName.trim(),
      signUpEmail.trim()
    );

    if (!success) {
      setSignUpError('Username already exists. Please choose a different username.');
      setSignUpUsername('');
    } else {
      setSignUpSuccess('Account created successfully! You can now log in.');
      setSignUpUsername('');
      setSignUpPassword('');
      setSignUpName('');
      setSignUpEmail('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4">
      <Card className="w-full max-w-md shadow-xl border-2">
        <CardHeader className="space-y-4 text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-bg rounded-2xl flex items-center justify-center shadow-lg">
            <Code2 className="size-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl">SakarRobotics</CardTitle>
            <CardDescription className="mt-2">
              Sign in to your account or create a new one
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-[#F46F50] hover:bg-[#e05a3d] text-white" size="lg">
                  Sign In
                </Button>

                <div className="pt-4 border-t mt-6">
                  <p className="text-sm text-muted-foreground text-center">
                    Demo credentials available in the system
                  </p>
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    <p>• <strong>john.dev</strong> / password123</p>
                    <p>• <strong>sarah.lead</strong> / password123</p>
                    <p>• <strong>mike.reviewer</strong> / password123</p>
                  </div>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                {signUpError && (
                  <Alert variant="destructive">
                    <AlertDescription>{signUpError}</AlertDescription>
                  </Alert>
                )}

                {signUpSuccess && (
                  <Alert className="bg-green-50 text-green-900 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                    <AlertDescription>{signUpSuccess}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      className="pl-10"
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      className="pl-10"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="Choose a username"
                      value={signUpUsername}
                      onChange={(e) => setSignUpUsername(e.target.value)}
                      className="pl-10"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password (min. 6 characters)"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      className="pl-10"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-[#F46F50] hover:bg-[#e05a3d] text-white" size="lg">
                  Create Account
                </Button>

                <p className="text-xs text-muted-foreground text-center pt-2">
                  By signing up, you'll be able to join projects when invited by project leads
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
