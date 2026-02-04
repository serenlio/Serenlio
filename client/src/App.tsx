import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/lib/auth";
import Home from "@/pages/home";
import Library from "@/pages/library";
import Session from "@/pages/session";
import Teachers from "@/pages/teachers";
import Teacher from "@/pages/teacher";
import Favorites from "@/pages/favorites";
import Profile from "@/pages/profile";
import Stats from "@/pages/stats";
import Login from "@/pages/login";
import Register from "@/pages/register";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/library" component={Library} />
      <Route path="/session/:id" component={Session} />
      <Route path="/teachers" component={Teachers} />
      <Route path="/teacher/:id" component={Teacher} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/profile" component={Profile} />
      <Route path="/stats" component={Stats} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { rehydrateAuth } = useAuth();

  useEffect(() => {
    rehydrateAuth();
  }, [rehydrateAuth]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Router />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="serenlio-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
