import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, MessageSquare, User } from 'lucide-react';
import { Button } from '../ui/button';
import { ThemeToggle } from './theme-toggle';

export function Navbar() {
  return (
    <nav className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <Link to="/" className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">FirmTalks</span>
            </Link>
            <div className="ml-10 flex items-center space-x-4">
              <Link to="/scanner" className="text-foreground/80 hover:text-foreground">
                Malware Scanner
              </Link>
              <Link to="/discussions" className="text-foreground/80 hover:text-foreground">
                Discussions
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button variant="ghost">
              <MessageSquare className="mr-2 h-4 w-4" />
              New Discussion
            </Button>
            <Button variant="ghost">
              <User className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}