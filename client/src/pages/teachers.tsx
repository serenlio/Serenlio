import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { api } from "@shared/routes";
import type { TeacherResponse } from "@shared/routes";

function TeacherCard({ teacher }: { teacher: TeacherResponse }) {
  return (
    <Link href={`/teacher/${teacher.id}`}>
      <Card className="hover-elevate cursor-pointer transition-all duration-200" data-testid={`card-teacher-${teacher.id}`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {teacher.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground mb-1">{teacher.name}</h3>
              <Badge variant="secondary" className="mb-2">{teacher.specialty}</Badge>
              <p className="text-sm text-muted-foreground line-clamp-2">{teacher.bio}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function TeacherCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-5 w-24 mb-2" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Teachers() {
  const { data: teachers, isLoading } = useQuery<TeacherResponse[]>({
    queryKey: [api.teachers.list.path],
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
            Audio Curators
          </h1>
          <p className="text-muted-foreground">
            Ambient soundscapes from experienced wellness creators
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <TeacherCardSkeleton key={i} />
            ))}
          </div>
        ) : teachers?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No teachers found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teachers?.map((teacher) => (
              <TeacherCard key={teacher.id} teacher={teacher} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
