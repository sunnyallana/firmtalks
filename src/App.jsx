import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/navbar';
import { useTheme } from './lib/theme';

function App() {
  const { isDark } = useTheme();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Navbar />
        <Routes>
          <Route
            path="/"
            element={
              <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col items-center justify-center space-y-8 text-center">
                  <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                    Welcome to FirmTalks
                  </h1>
                  <p className="text-xl text-foreground/80 max-w-2xl">
                    The premier platform for firmware professionals and enthusiasts to detect malware
                    and collaborate on firmware-related discussions.
                  </p>
                  <div className="flex space-x-4">
                    <a
                      href="/scanner"
                      className="rounded-md bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
                    >
                      Scan Firmware
                    </a>
                    <a
                      href="/discussions"
                      className="rounded-md bg-muted px-6 py-3 text-foreground hover:bg-muted/90"
                    >
                      Join Discussions
                    </a>
                  </div>
                </div>
              </main>
            }
          />

          {/* <Route path="/discussions" element={<DiscussionsPage />} /> */}
          <Route path="/discussions" />
        </Routes>
      </div>
    </Router>
  );
}

export default App;