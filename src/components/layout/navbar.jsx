import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, MessageSquare, User, Menu, X, BarChart2 } from 'lucide-react';
import { Button } from '../ui/button';
import { ThemeToggle } from './theme-toggle';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          {/* Logo and Desktop Navigation */}
          <div className="flex">
            <Link to="/" className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">FirmTalks</span>
            </Link>

            <SignedIn>
              <div className="hidden md:ml-10 md:flex md:items-center md:space-x-6">
                <Link 
                  to="/statistics" 
                  className="flex items-center text-foreground/80 hover:text-foreground"
                >
                  <BarChart2 className="mr-2 h-4 w-4" />
                  Platform Statistics
                </Link>
                <Link 
                  to="/scanner" 
                  className="flex items-center text-foreground/80 hover:text-foreground"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Malware Scanner
                </Link>
                <Link 
                  to="/discussions" 
                  className="flex items-center text-foreground/80 hover:text-foreground"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Discussions
                </Link>
              </div>
            </SignedIn>
          </div>

          {/* Desktop Right Section */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            
            <SignedIn>
              <Button variant="ghost" className="hidden md:flex">
                <MessageSquare className="mr-2 h-4 w-4" />
                New Discussion
              </Button>
            </SignedIn>

            <SignedOut>
              <Button variant="ghost" className="hidden md:flex">
                <User className="mr-2 h-4 w-4" />
                <SignInButton />
              </Button>
            </SignedOut>

            <SignedIn>
              <UserButton />
            </SignedIn>

            {/* Mobile Menu Button */}
            <SignedIn>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </SignedIn>
          </div>
        </div>

        {/* Mobile Menu */}
        <SignedIn>
          {isMenuOpen && (
            <div className="border-t border-border md:hidden">
              <div className="flex flex-col space-y-4 py-4">
                <Link 
                  to="/statistics"
                  className="flex items-center px-2 py-2 text-foreground/80 hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <BarChart2 className="mr-2 h-4 w-4" />
                  Platform Statistics
                </Link>
                <Link 
                  to="/scanner"
                  className="flex items-center px-2 py-2 text-foreground/80 hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Malware Scanner
                </Link>
                <Link 
                  to="/discussions"
                  className="flex items-center px-2 py-2 text-foreground/80 hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Discussions
                </Link>
                <Button variant="ghost" className="justify-start" onClick={() => setIsMenuOpen(false)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  New Discussion
                </Button>
              </div>
            </div>
          )}
        </SignedIn>
      </div>
    </nav>
  );
}