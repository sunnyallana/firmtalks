import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="py-6 px-2 mt-auto bg-background-paper/80 dark:bg-background-default/80 border-t border-border backdrop-blur-lg">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Left side - Branding */}
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">FirmTalks</span>
          </Link>

          {/* Middle - Copyright */}
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()} FirmTalks. All rights reserved.
          </p>

          {/* Right side - Developer info */}
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/sunnyallana"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Developed by Sunny Shaban Ali
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
