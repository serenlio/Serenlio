import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Clock, Flame, Star, ArrowRight } from "lucide-react";
import { api, buildUrl } from "@shared/routes";
import type { SessionWithTeacherResponse } from "@shared/routes";
import { useAuth } from "@/lib/auth";

function SessionCard({ session }: { session: SessionWithTeacherResponse }) {
  const categoryColors: Record<string, string> = {
    meditation: "bg-primary/10 text-primary",
    sleep: "bg-accent text-accent-foreground",
    breathwork: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    music: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  };

  return (
    <Link href={`/session/${session.id}`}>
      <Card className="hover-elevate cursor-pointer transition-all duration-200 h-full" data-testid={`card-session-${session.id}`}>
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
          <h3 className="font-medium text-foreground mb-1 line-clamp-2">{session.title}</h3>
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

export default function Home() {
  const { user } = useAuth();

  const { data: dailySession, isLoading: dailyLoading } = useQuery<SessionWithTeacherResponse>({
    queryKey: [api.home.daily.path],
  });

  const { data: featuredSessions, isLoading: featuredLoading } = useQuery<SessionWithTeacherResponse[]>({
    queryKey: [api.home.featured.path],
  });

  const { data: popularSessions, isLoading: popularLoading } = useQuery<SessionWithTeacherResponse[]>({
    queryKey: [api.home.popular.path],
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
            {user ? `Welcome back, ${user.name}` : "Pure ambient calm"}
          </h1>
          <p className="text-muted-foreground">
            Voice-free meditation and sleep
          </p>
        </div>

        {dailyLoading ? (
          <Card className="mb-8 bg-gradient-to-r from-primary/10 to-accent/10">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-40 mb-4" />
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-10 w-32" />
            </CardContent>
          </Card>
        ) : dailySession ? (
          <Card className="mb-8 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20" data-testid="card-daily-session">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">Daily Selection</span>
              </div>
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
                {dailySession.title}
              </h2>
              <p className="text-muted-foreground mb-1">
                {dailySession.teacher?.name ? `Curated by ${dailySession.teacher.name}` : "Curated Audio"}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {dailySession.duration} min
                </span>
                <Badge variant="secondary">{dailySession.category}</Badge>
              </div>
              <Link href={`/session/${dailySession.id}`}>
                <Button data-testid="button-start-daily">
                  <Play className="w-4 h-4 mr-2" />
                  Listen Now
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : null}

        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Featured Sessions</h2>
            <Link href="/library">
              <Button variant="ghost" size="sm" data-testid="link-view-all-featured">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredLoading ? (
              <>
                <SessionCardSkeleton />
                <SessionCardSkeleton />
                <SessionCardSkeleton />
              </>
            ) : (
              featuredSessions?.slice(0, 3).map((session) => (
                <SessionCard key={session.id} session={session} />
              ))
            )}
          </div>
        </section>

        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Popular Sessions</h2>
            <Link href="/library">
              <Button variant="ghost" size="sm" data-testid="link-view-all-popular">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularLoading ? (
              <>
                <SessionCardSkeleton />
                <SessionCardSkeleton />
                <SessionCardSkeleton />
                <SessionCardSkeleton />
              </>
            ) : (
              popularSessions?.slice(0, 4).map((session) => (
                <SessionCard key={session.id} session={session} />
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Explore Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Meditation", icon: "🧘", color: "from-teal-500/20 to-teal-600/20" },
              { name: "Sleep", icon: "🌙", color: "from-indigo-500/20 to-indigo-600/20" },
              { name: "Breathwork", icon: "💨", color: "from-blue-500/20 to-blue-600/20" },
              { name: "Music", icon: "🎵", color: "from-amber-500/20 to-amber-600/20" },
            ].map((cat) => (
              <Link key={cat.name} href={`/library?category=${cat.name.toLowerCase()}`}>
                <Card className={`hover-elevate cursor-pointer bg-gradient-to-br ${cat.color}`} data-testid={`card-category-${cat.name.toLowerCase()}`}>
                  <CardContent className="p-6 text-center">
                    <span className="text-3xl mb-2 block">{cat.icon}</span>
                    <span className="font-medium text-foreground">{cat.name}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
