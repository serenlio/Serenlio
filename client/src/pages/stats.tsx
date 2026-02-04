import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Users, Headphones } from "lucide-react";
import { api } from "@shared/routes";

export default function Stats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: [api.stats.usage.path],
    queryFn: async () => {
      const res = await fetch(api.stats.usage.path);
      if (!res.ok) throw new Error("Failed to load stats");
      return res.json() as Promise<{ userCount: number; sessions: { id: number; title: string; playCount: number }[] }>;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-full mb-4" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold mb-6">Usage statistics</h1>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5" />
                Total users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{stats?.userCount ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Headphones className="w-5 h-5" />
                Session plays
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(stats?.sessions ?? []).map((s) => (
                  <li key={s.id} className="flex justify-between items-center text-sm">
                    <Link href={`/session/${s.id}`} className="text-primary hover:underline truncate flex-1 mr-2">
                      {s.title}
                    </Link>
                    <span className="text-muted-foreground shrink-0">{s.playCount} plays</span>
                  </li>
                ))}
                {(!stats?.sessions || stats.sessions.length === 0) && (
                  <li className="text-muted-foreground text-sm">No session data yet.</li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
