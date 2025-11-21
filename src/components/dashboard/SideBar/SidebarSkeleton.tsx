import { Skeleton } from "@/components/ui/skeleton";

export function SidebarSkeleton() {
  return (
    <div className="space-y-6 p-2 animate-in fade-in duration-500">
      {/* Search Bar Placeholder */}
      <Skeleton className="h-10 w-full rounded-md bg-muted/40" />

      {/* "Alone Chapters" Section Mimic */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-24 bg-muted/30" /> {/* Section Title */}
        <div className="space-y-2 pl-2">
            <Skeleton className="h-8 w-full bg-muted/20" />
            <Skeleton className="h-8 w-3/4 bg-muted/20" />
        </div>
      </div>

      {/* "Subjects" Section Mimic */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-20 bg-muted/30" /> {/* Section Title */}
        <div className="space-y-2">
            {/* Subject 1 */}
            <div className="space-y-2">
                <Skeleton className="h-9 w-full bg-muted/30" />
                <div className="pl-4 space-y-2">
                    <Skeleton className="h-8 w-11/12 bg-muted/20" />
                    <Skeleton className="h-8 w-10/12 bg-muted/20" />
                </div>
            </div>
            {/* Subject 2 */}
            <Skeleton className="h-9 w-full bg-muted/30" />
        </div>
      </div>
    </div>
  );
}