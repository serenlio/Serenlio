import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Flame, Clock, Trophy, LogOut, Star } from "lucide-react";
import { api } from "@shared/routes";
import type { UserStatsResponse } from "@shared/routes";
import { useAuth, getAuthHeader } from "@/lib/auth";

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading } = useQuery<UserStatsResponse>({
    queryKey: [api.progress.stats.path],
    queryFn: async () => {
      const res = await fetch(api.progress.stats.path, {
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: isAuthenticated(),
  });

  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Sign in to view your profile</h2>
          <p className="text-muted-foreground mb-4">
            Track your meditation progress and streaks
          </p>
          <Link href="/login">
            <Button data-testid="button-sign-in">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {user?.name?.split(" ").map((n) => n[0]).join("") || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-semibold text-foreground" data-testid="text-user-name">
                  {user?.name}
                </h1>
                <p className="text-muted-foreground" data-testid="text-user-email">
                  {user?.email}
                </p>
                {user?.isPremium && (
                  <Badge className="mt-2">
                    <Star className="w-3 h-3 mr-1" />
                    Premium Member
                  </Badge>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        <h2 className="text-lg font-semibold text-foreground mb-4">Your Progress</h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array(3).fill(0).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="w-8 h-8 mb-3" />
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card data-testid="card-streak">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Flame className="w-6 h-6 text-orange-500" />
                </div>
                <p className="text-3xl font-bold text-foreground" data-testid="text-streak">
                  {stats?.currentStreak || 0}
                </p>
                <p className="text-sm text-muted-foreground">Day Streak</p>
              </CardContent>
            </Card>

            <Card data-testid="card-minutes">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <p className="text-3xl font-bold text-foreground" data-testid="text-minutes">
                  {stats?.totalMinutes || 0}
                </p>
                <p className="text-sm text-muted-foreground">Total Minutes</p>
              </CardContent>
            </Card>

            <Card data-testid="card-sessions">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto mb-3">
                  <Trophy className="w-6 h-6 text-accent-foreground" />
                </div>
                <p className="text-3xl font-bold text-foreground" data-testid="text-sessions">
                  {stats?.sessionsCompleted || 0}
                </p>
                <p className="text-sm text-muted-foreground">Sessions Completed</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/library">
                <Button variant="ghost" className="w-full justify-start" data-testid="button-browse-sessions">
                  Browse Sessions
                </Button>
              </Link>
              <Link href="/favorites">
                <Button variant="ghost" className="w-full justify-start" data-testid="button-view-favorites">
                  View Favorites
                </Button>
              </Link>
              <Link href="/teachers">
                <Button variant="ghost" className="w-full justify-start" data-testid="button-explore-teachers">
                  Explore Teachers
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
