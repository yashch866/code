import { Button } from './ui/button';
import { Code2, FolderOpen, BarChart3, LogOut, Menu, X, FolderKanban, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { cn } from './ui/utils';

type NavigationProps = {
  userName: string;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
};

export function Navigation({ userName, currentView, onNavigate, onLogout }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { 
      id: 'main', 
      label: 'Dashboard', 
      icon: Code2,
      description: 'View and submit your code'
    },
    { 
      id: 'projects', 
      label: 'Projects Archive', 
      icon: FolderOpen,
      description: 'Browse completed projects'
    },
    { 
      id: 'manage-projects', 
      label: 'Manage Projects', 
      icon: FolderKanban,
      description: 'Create and manage teams'
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: BarChart3,
      description: 'Track performance metrics'
    },
  ];

  return (
    <>
      {/* Top Header Bar */}
      <div className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 gradient-bg text-white rounded-lg flex items-center justify-center shadow-md">
                <Code2 className="size-6" />
              </div>
              <div>
                <h1 className="leading-none">SakarRobotics</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Streamlined code submission and review
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="font-medium">{userName}</p>
              </div>
              <Button variant="outline" onClick={onLogout} className="gap-2 hidden sm:flex">
                <LogOut className="size-4" />
                Logout
              </Button>

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="outline" size="icon">
                    {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <div className="space-y-4 mt-8">
                    <div className="pb-4 border-b">
                      <p className="font-medium">{userName}</p>
                    </div>
                    <div className="flex flex-col gap-3">
                      {navItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            onNavigate(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg text-left transition-all",
                            currentView === item.id
                              ? "bg-[#F46F50] text-white"
                              : "hover:bg-accent"
                          )}
                        >
                          <item.icon className="size-5" />
                          <div>
                            <div className="font-medium">{item.label}</div>
                            <div className={cn(
                              "text-xs mt-0.5",
                              currentView === item.id ? "text-white/90" : "text-muted-foreground"
                            )}>
                              {item.description}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <Button variant="outline" onClick={onLogout} className="gap-2 w-full">
                      <LogOut className="size-4" />
                      Logout
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Cards - Below Header */}
      <div className="bg-gradient-to-b from-muted/30 to-background border-b">
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all hover:shadow-md",
                    isActive
                      ? "border-[#F46F50] bg-[#F46F50]/5 shadow-sm"
                      : "border-border bg-card hover:border-[#F46F50]/30"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-lg p-2.5 transition-all",
                      isActive
                        ? "bg-[#F46F50] text-white shadow-lg shadow-[#F46F50]/20"
                        : "bg-muted text-muted-foreground group-hover:bg-[#F46F50]/10 group-hover:text-[#F46F50]"
                    )}
                  >
                    <item.icon className="size-5" />
                  </div>
                  <h3 className="font-medium flex-1">{item.label}</h3>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
