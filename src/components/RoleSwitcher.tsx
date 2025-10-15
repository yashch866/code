import { Card, CardContent } from './ui/card';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Code, Shield, UserCheck } from 'lucide-react';
import { UserRole, Project } from '../types';

type RoleSwitcherProps = {
  currentRole: UserRole;
  availableRoles: UserRole[];
  onRoleChange: (role: UserRole) => void;
  projects: Project[];
  userId: string;
};

export function RoleSwitcher({ currentRole, availableRoles, onRoleChange, projects, userId }: RoleSwitcherProps) {
  // Count how many projects user has each role in
  const roleCounts = {
    developer: projects.filter(p => p.members.some(m => m.userId === userId && m.role === 'developer')).length,
    lead: projects.filter(p => p.members.some(m => m.userId === userId && m.role === 'lead')).length,
    reviewer: projects.filter(p => p.members.some(m => m.userId === userId && m.role === 'reviewer')).length,
  };

  return (
    <Card className="border-2 shadow-sm">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div>
            <h3>Your Roles</h3>
            <p className="text-sm text-muted-foreground">
              Switch between your assigned roles across different projects
            </p>
          </div>
          <Tabs value={currentRole} onValueChange={(value) => onRoleChange(value as UserRole)}>
            <TabsList className="grid w-full grid-cols-3 h-auto p-1">
              <TabsTrigger 
                value="developer" 
                disabled={!availableRoles.includes('developer')}
                className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-[#F46F50] data-[state=active]:text-white"
              >
                <Code className="size-5" />
                <span>Developer</span>
                {roleCounts.developer > 0 && (
                  <span className="text-xs opacity-80">
                    {roleCounts.developer} {roleCounts.developer === 1 ? 'project' : 'projects'}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="lead" 
                disabled={!availableRoles.includes('lead')}
                className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-[#F46F50] data-[state=active]:text-white"
              >
                <Shield className="size-5" />
                <span>Project Lead</span>
                {roleCounts.lead > 0 && (
                  <span className="text-xs opacity-80">
                    {roleCounts.lead} {roleCounts.lead === 1 ? 'project' : 'projects'}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="reviewer" 
                disabled={!availableRoles.includes('reviewer')}
                className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-[#F46F50] data-[state=active]:text-white"
              >
                <UserCheck className="size-5" />
                <span>Reviewer</span>
                {roleCounts.reviewer > 0 && (
                  <span className="text-xs opacity-80">
                    {roleCounts.reviewer} {roleCounts.reviewer === 1 ? 'project' : 'projects'}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
