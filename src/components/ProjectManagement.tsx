import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from './ui/command';
import { Plus, Users, FolderKanban, Trash2, UserPlus, Search, Check, Clock } from 'lucide-react';
import { Project, User, UserRole } from '../types';
import { toast } from 'sonner@2.0.3';
import { cn } from './ui/utils';
import { projectsApi } from '../services/api';

type ProjectManagementProps = {
  projects: Project[];
  currentUser: User;
  companyUsers: User[];
  onCreateProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  onAddMember: (projectId: string, userId: string, role: UserRole) => void;
  onRemoveMember: (projectId: string, userId: string) => void;
  onDeleteProject: (projectId: string) => void;
};

export function ProjectManagement({
  projects,
  currentUser,
  companyUsers,
  onCreateProject,
  onAddMember,
  onRemoveMember,
  onDeleteProject,
}: ProjectManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserName, setSelectedUserName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('developer');
  const [openCombobox, setOpenCombobox] = useState<Record<string, boolean>>({});
  const [recentConnections, setRecentConnections] = useState<string[]>([]);

  const handleCreateProject = async (data: { name: string; description: string }) => {
    try {
      console.log('Creating project:', data); // Debug log
      const response = await projectsApi.create({
        name: data.name,
        description: data.description
      });
      console.log('Project creation response:', response); // Debug log
      
      if (response.data.success) {
        toast.success('Project created successfully');
        // Refresh projects list
        const updatedProjects = await projectsApi.getAll();
        setProjects(updatedProjects.data);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project');
    }
  };

  const handleAddMember = (projectId: string) => {
    if (!projectId || !selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    const project = projects.find(p => p.id === projectId);
    if (project?.members.some(m => m.userId === selectedUserId)) {
      toast.error('User is already a member of this project');
      return;
    }

    onAddMember(projectId, selectedUserId, selectedRole);
    
    // Add to recent connections
    setRecentConnections(prev => {
      const newRecent = [selectedUserId, ...prev.filter(id => id !== selectedUserId)].slice(0, 5);
      return newRecent;
    });
    
    setSelectedUserId('');
    setSelectedUserName('');
    setOpenCombobox({ ...openCombobox, [projectId]: false });
    toast.success('Member added to project');
  };

  const getAvailableUsers = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return [];

    return companyUsers.filter(
      (user) =>
        user.id !== currentUser.id &&
        !project.members.some((m) => m.userId === user.id)
    );
  };

  const getRecentUsers = (projectId: string) => {
    const availableUsers = getAvailableUsers(projectId);
    return recentConnections
      .map(id => availableUsers.find(u => u.id === id))
      .filter(Boolean) as User[];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Project Management</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage projects, add team members, and assign roles
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#F46F50] hover:bg-[#e05a3d] text-white">
              <Plus className="size-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Set up a new project and start collaborating with your team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="Enter project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  placeholder="Describe the project"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                onClick={() => handleCreateProject({ name: newProjectName, description: newProjectDescription })}
                className="w-full bg-[#F46F50] hover:bg-[#e05a3d] text-white"
              >
                Create Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.length === 0 ? (
          <Card className="col-span-full border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FolderKanban className="size-16 text-muted-foreground mb-4" />
              <h3 className="text-xl mb-2">No projects yet</h3>
              <p className="text-muted-foreground text-center mb-6">
                Create your first project to get started with code reviews
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-[#F46F50] hover:bg-[#e05a3d] text-white">
                <Plus className="size-4 mr-2" />
                Create Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => {
            const availableUsers = getAvailableUsers(project.id);
            const recentUsers = getRecentUsers(project.id);
            const isOpen = openCombobox[project.id] || false;
            
            return (
              <Card key={project.id} className="border-2 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {project.description || 'No description'}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="flex items-center gap-2">
                        <Users className="size-4" />
                        Team Members ({project.members.length})
                      </h4>
                      {project.createdBy === currentUser.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteProject(project.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {project.members.map((member) => (
                        <div
                          key={member.userId}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{member.userName}</p>
                            <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                          </div>
                          {project.createdBy === currentUser.id && member.userId !== currentUser.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRemoveMember(project.id, member.userId)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {project.createdBy === currentUser.id && (
                    <div className="pt-3 border-t space-y-3">
                      <h4 className="flex items-center gap-2">
                        <UserPlus className="size-4" />
                        Add Team Member
                      </h4>
                      
                      <div className="flex gap-2">
                        <Popover 
                          open={isOpen} 
                          onOpenChange={(open) => {
                            setOpenCombobox({ ...openCombobox, [project.id]: open });
                            if (open) setSelectedProject(project.id);
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={isOpen}
                              className="flex-1 justify-between"
                            >
                              {selectedUserId && selectedProject === project.id
                                ? selectedUserName
                                : "Search users..."}
                              <Search className="ml-2 size-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[350px] p-0" align="start">
                            <Command shouldFilter={true}>
                              <CommandInput placeholder="Search by name, username or email..." />
                              <CommandList>
                                <CommandEmpty>No users found.</CommandEmpty>
                                
                                {recentUsers.length > 0 && (
                                  <>
                                    <CommandGroup heading="Recent">
                                      {recentUsers.map((user) => (
                                        <CommandItem
                                          key={`recent-${user.id}`}
                                          value={`${user.name.toLowerCase()} ${user.username.toLowerCase()} ${user.email.toLowerCase()}`}
                                          onSelect={() => {
                                            setSelectedProject(project.id);
                                            setSelectedUserId(user.id);
                                            setSelectedUserName(user.name);
                                            setOpenCombobox({ ...openCombobox, [project.id]: false });
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 size-4",
                                              selectedUserId === user.id && selectedProject === project.id
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          <Clock className="mr-2 size-4 text-muted-foreground" />
                                          <div className="flex flex-col flex-1 min-w-0">
                                            <span className="truncate">{user.name}</span>
                                            <span className="text-xs text-muted-foreground truncate">
                                              @{user.username}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                    <CommandSeparator />
                                  </>
                                )}
                                
                                <CommandGroup heading="All Users">
                                  {availableUsers.map((user) => (
                                    <CommandItem
                                      key={user.id}
                                      value={`${user.name.toLowerCase()} ${user.username.toLowerCase()} ${user.email.toLowerCase()}`}
                                      onSelect={() => {
                                        setSelectedProject(project.id);
                                        setSelectedUserId(user.id);
                                        setSelectedUserName(user.name);
                                        setOpenCombobox({ ...openCombobox, [project.id]: false });
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 size-4",
                                          selectedUserId === user.id && selectedProject === project.id
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      <div className="flex flex-col flex-1 min-w-0">
                                        <span className="truncate">{user.name}</span>
                                        <span className="text-xs text-muted-foreground truncate">
                                          @{user.username} • {user.email}
                                        </span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>

                        <Select
                          value={selectedProject === project.id ? selectedRole : 'developer'}
                          onValueChange={(value: UserRole) => {
                            setSelectedProject(project.id);
                            setSelectedRole(value);
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="developer">Developer</SelectItem>
                            <SelectItem value="reviewer">Reviewer</SelectItem>
                            <SelectItem value="lead">Lead</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          onClick={() => handleAddMember(project.id)}
                          disabled={selectedProject !== project.id || !selectedUserId}
                          className="bg-[#F46F50] hover:bg-[#e05a3d] text-white"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
