import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Clock, Star } from "lucide-react";
import { api, buildUrl } from "@shared/routes";
import type { TeacherResponse, SessionResponse } from "@shared/routes";

interface TeacherWithSessions extends TeacherResponse {
  sessions: SessionResponse[];
}

function SessionCard({ session }: { session: SessionResponse }) {
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
          <div className="flex items-start justify-between gap-2 mb-2">
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{session.duration} min</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Teacher() {
  const { id } = useParams<{ id: string }>();

  const { data: teacher, isLoading } = useQuery<TeacherWithSessions>({
    queryKey: [api.teachers.get.path, id],
    queryFn: async () => {
      const res = await fetch(buildUrl(api.teachers.get.path, { id: id! }));
      if (!res.ok) throw new Error("Failed to fetch teacher");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="flex items-start gap-6 mb-8">
            <Skeleton className="w-24 h-24 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-5 w-32 mb-4" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Teacher not found</h2>
          <Link href="/teachers">
            <Button variant="outline">Browse Teachers</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/teachers">
          <Button variant="ghost" className="mb-6" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            All Teachers
          </Button>
        </Link>

        <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
          <Avatar className="w-24 h-24">
            <AvatarFallback className="bg-primary/10 text-primary text-3xl">
              {teacher.name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2" data-testid="text-teacher-name">
              {teacher.name}
            </h1>
            <Badge variant="secondary" className="mb-4">{teacher.specialty}</Badge>
            <p className="text-muted-foreground">{teacher.bio}</p>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-foreground mb-4">
          Sessions by {teacher.name.split(" ")[0]}
        </h2>

        {teacher.sessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No sessions available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teacher.sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
