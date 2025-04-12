import { useState } from "react";
import { Link } from "react-router-dom";
import { Shield, MessageSquare, User, Menu, X, BarChart2 } from "lucide-react";
import { Button } from "../ui/button";
import { ThemeToggle } from "./theme-toggle";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import { NotificationBell } from "../notificationComponent";

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

            <div className="hidden md:ml-10 md:flex md:items-center md:space-x-6">
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
          </div>

          {/* Desktop Right Section */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />

            <SignedOut>
              <div className="hidden md:block">
                <SignInButton mode="modal">
                  <Button variant="ghost" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Sign In</span>
                  </Button>
                </SignInButton>
              </div>
            </SignedOut>

            <SignedIn>
              <NotificationBell />
              <UserButton />
            </SignedIn>

            {/* Mobile Menu Button */}
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
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="border-t border-border md:hidden">
            <div className="flex flex-col space-y-4 py-4">
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

              {/* Add sign-in button to mobile menu */}
              <SignedOut>
                <div className="px-2 py-2">
                  <SignInButton mode="modal">
                    <Button
                      variant="ghost"
                      className="flex w-full items-center justify-start"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Sign In</span>
                    </Button>
                  </SignInButton>
                </div>
              </SignedOut>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
