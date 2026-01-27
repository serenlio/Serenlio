import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Heart, 
  Clock, 
  User,
  ArrowLeft,
  Star
} from "lucide-react";
import { api, buildUrl } from "@shared/routes";
import type { SessionWithTeacherResponse } from "@shared/routes";
import { useState, useEffect, useRef } from "react";
import { useAuth, getAuthHeader } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Session() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data: session, isLoading } = useQuery<SessionWithTeacherResponse>({
    queryKey: [api.sessions.get.path, id],
    queryFn: async () => {
      const res = await fetch(buildUrl(api.sessions.get.path, { id: id! }));
      if (!res.ok) throw new Error("Failed to fetch session");
      return res.json();
    },
  });

  const { data: favoriteStatus } = useQuery<{ isFavorite: boolean }>({
    queryKey: [api.favorites.check.path, id],
    queryFn: async () => {
      const res = await fetch(buildUrl(api.favorites.check.path, { sessionId: id! }), {
        headers: getAuthHeader(),
      });
      if (!res.ok) return { isFavorite: false };
      return res.json();
    },
    enabled: isAuthenticated(),
  });

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      const res = await fetch(buildUrl(api.favorites.toggle.path, { sessionId: id! }), {
        method: "POST",
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error("Failed to toggle favorite");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.favorites.check.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.favorites.list.path] });
    },
  });

  const recordProgress = useMutation({
    mutationFn: async (minutes: number) => {
      const res = await fetch(api.progress.record.path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ sessionId: parseInt(id!), minutesListened: minutes }),
      });
      if (!res.ok) throw new Error("Failed to record progress");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.progress.stats.path] });
    },
  });

  const incrementPlay = useMutation({
    mutationFn: async () => {
      const res = await fetch(buildUrl(api.sessions.incrementPlay.path, { id: id! }), {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to increment play count");
      return res.json();
    },
  });

  useEffect(() => {
    if (session) {
      setDuration(session.duration * 60);
    }
  }, [session]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            if (isAuthenticated() && session) {
              recordProgress.mutate(session.duration);
              toast({
                title: "Session Complete",
                description: `You meditated for ${session.duration} minutes. Great job!`,
              });
            }
            return duration;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, duration]);

  const handlePlayPause = () => {
    if (!isPlaying && currentTime === 0) {
      incrementPlay.mutate();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const categoryColors: Record<string, string> = {
    meditation: "bg-primary/10 text-primary",
    sleep: "bg-accent text-accent-foreground",
    breathwork: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    music: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <Card>
            <CardContent className="p-8">
              <Skeleton className="h-6 w-24 mb-4" />
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-6" />
              <Skeleton className="h-48 w-full mb-6" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Session not found</h2>
          <Link href="/library">
            <Button variant="outline">Browse Library</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/library">
          <Button variant="ghost" className="mb-6" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Button>
        </Link>

        <Card className="overflow-hidden">
          <div className={`h-32 bg-gradient-to-br ${
            session.category === "meditation" ? "from-teal-400/30 to-teal-600/30" :
            session.category === "sleep" ? "from-indigo-400/30 to-purple-600/30" :
            session.category === "breathwork" ? "from-blue-400/30 to-cyan-600/30" :
            "from-amber-400/30 to-orange-600/30"
          }`} />
          
          <CardContent className="p-6 -mt-8 relative">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className={categoryColors[session.category] || ""}>
                    {session.category}
                  </Badge>
                  {session.isPremium && (
                    <Badge variant="outline">
                      <Star className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl font-semibold text-foreground mb-1" data-testid="text-session-title">
                  {session.title}
                </h1>
                {session.teacher && (
                  <Link href={`/teacher/${session.teacher.id}`}>
                    <span className="text-muted-foreground hover:text-foreground flex items-center gap-1" data-testid="link-teacher">
                      <User className="w-4 h-4" />
                      {session.teacher.name}
                    </span>
                  </Link>
                )}
              </div>
              {isAuthenticated() && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleFavorite.mutate()}
                  disabled={toggleFavorite.isPending}
                  data-testid="button-favorite"
                >
                  <Heart
                    className={`w-5 h-5 ${favoriteStatus?.isFavorite ? "fill-red-500 text-red-500" : ""}`}
                  />
                </Button>
              )}
            </div>

            <p className="text-muted-foreground mb-6">{session.description}</p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {session.duration} min
              </span>
              <span>{session.playCount || 0} plays</span>
            </div>

            <div className="bg-muted/50 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-center gap-6 mb-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentTime(Math.max(0, currentTime - 15))}
                  data-testid="button-rewind"
                >
                  <SkipBack className="w-6 h-6" />
                </Button>
                <Button
                  size="lg"
                  className="w-16 h-16 rounded-full"
                  onClick={handlePlayPause}
                  data-testid="button-play-pause"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8 ml-1" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentTime(Math.min(duration, currentTime + 15))}
                  data-testid="button-forward"
                >
                  <SkipForward className="w-6 h-6" />
                </Button>
              </div>

              <div className="space-y-2">
                <Progress value={progressPercent} className="h-2" data-testid="progress-bar" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span data-testid="text-current-time">{formatTime(currentTime)}</span>
                  <span data-testid="text-duration">{formatTime(duration)}</span>
                </div>
              </div>
            </div>

            {!isAuthenticated() && (
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Sign in to save your progress and favorites
                </p>
                <Link href="/login">
                  <Button variant="outline" size="sm" data-testid="button-sign-in-prompt">
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
