import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Search, Star, X } from "lucide-react";
import { api } from "@shared/routes";
import type { SessionWithTeacherResponse } from "@shared/routes";
import { useState, useEffect } from "react";

const categories = ["all", "meditation", "sleep", "breathwork", "music"] as const;
const durations = [
  { label: "All", value: "" },
  { label: "5 min", value: "5" },
  { label: "10 min", value: "10" },
  { label: "20 min", value: "20" },
  { label: "30+ min", value: "30" },
];

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
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{session.description}</p>
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
        <Skeleton className="h-12 w-full mb-3" />
        <Skeleton className="h-4 w-16" />
      </CardContent>
    </Card>
  );
}

export default function Library() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const initialCategory = params.get("category") || "all";

  const [category, setCategory] = useState(initialCategory);
  const [duration, setDuration] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = new URLSearchParams();
  if (category !== "all") queryParams.set("category", category);
  if (duration) queryParams.set("duration", duration);
  if (debouncedSearch) queryParams.set("search", debouncedSearch);

  const { data: sessions, isLoading } = useQuery<SessionWithTeacherResponse[]>({
    queryKey: [api.sessions.list.path, category, duration, debouncedSearch],
    queryFn: async () => {
      const url = queryParams.toString() 
        ? `${api.sessions.list.path}?${queryParams.toString()}`
        : api.sessions.list.path;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch sessions");
      return res.json();
    },
  });

  const clearFilters = () => {
    setCategory("all");
    setDuration("");
    setSearch("");
  };

  const hasFilters = category !== "all" || duration || search;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
            Audio Library
          </h1>
          <p className="text-muted-foreground">
            Distraction-free background audio for focus and rest
          </p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="search"
              placeholder="Search sessions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </div>

        <Tabs value={category} onValueChange={setCategory} className="mb-6">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
            {categories.map((cat) => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="capitalize"
                data-testid={`tab-category-${cat}`}
              >
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-sm text-muted-foreground">Duration:</span>
          {durations.map((d) => (
            <Button
              key={d.value}
              variant={duration === d.value ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setDuration(d.value)}
              data-testid={`button-duration-${d.value || 'all'}`}
            >
              {d.label}
            </Button>
          ))}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ml-auto text-muted-foreground"
              data-testid="button-clear-filters"
            >
              <X className="w-4 h-4 mr-1" />
              Clear filters
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <SessionCardSkeleton key={i} />
            ))}
          </div>
        ) : sessions?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No sessions found</p>
            <Button variant="outline" onClick={clearFilters} data-testid="button-clear-all">
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions?.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
