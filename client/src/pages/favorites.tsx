import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Heart, Star } from "lucide-react";
import { api } from "@shared/routes";
import type { SessionWithTeacherResponse } from "@shared/routes";
import { useAuth, getAuthHeader } from "@/lib/auth";

function SessionCard({ session }: { session: SessionWithTeacherResponse }) {
  const categoryColors: Record<string, string> = {
    meditation: "bg-primary/10 text-primary",
    sleep: "bg-accent text-accent-foreground",
    breathwork: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    music: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  };

  return (
    <Link href={`/session/${session.id}`}>
      <Card className="hover-elevate cursor-pointer transition-all duration-200" data-testid={`card-session-${session.id}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <Badge variant="secondary" className={categoryColors[session.category] || ""}>
              {session.category}
            </Badge>
            {session.isPremium && (
              <Badge variant="outline" className="text-xs">
                <Star className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>
          <h3 className="font-medium text-foreground mb-1">{session.title}</h3>
          {session.teacher && (
            <p className="text-sm text-muted-foreground mb-2">{session.teacher.name}</p>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{session.duration} min</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function SessionCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <Skeleton className="h-5 w-20 mb-3" />
        <Skeleton className="h-5 w-full mb-2" />
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-4 w-16" />
      </CardContent>
    </Card>
  );
}

export default function Favorites() {
  const { isAuthenticated } = useAuth();

  const { data: favorites, isLoading } = useQuery<SessionWithTeacherResponse[]>({
    queryKey: [api.favorites.list.path],
    queryFn: async () => {
      const res = await fetch(api.favorites.list.path, {
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error("Failed to fetch favorites");
      return res.json();
    },
    enabled: isAuthenticated(),
  });

  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Sign in to view favorites</h2>
          <p className="text-muted-foreground mb-4">
            Save your favorite sessions to access them quickly
          </p>
          <Link href="/login">
            <Button data-testid="button-sign-in">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
            Your Favorites
          </h1>
          <p className="text-muted-foreground">
            Sessions you've saved for quick access
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <SessionCardSkeleton key={i} />
            ))}
          </div>
        ) : favorites?.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
            <p className="text-muted-foreground mb-4">
              Tap the heart icon on any session to save it here
            </p>
            <Link href="/library">
              <Button variant="outline" data-testid="button-browse">
                Browse Sessions
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites?.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
