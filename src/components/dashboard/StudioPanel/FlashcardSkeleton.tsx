import { Skeleton } from "@/components/ui/skeleton";


export function FlashcardSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 relative">
  
      <div className="absolute top-4 left-4">
        <Skeleton className="h-9 w-32" />
      </div>


      <div className="w-full max-w-md h-64 rounded-lg border border-border bg-card/50 shadow-sm flex flex-col items-center justify-center p-6 gap-4">
  
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
      </div>

      <div className="flex space-x-4 mt-6">
        <Skeleton className="h-9 w-9 rounded-md" /> {/* Prev Icon */}
        <Skeleton className="h-9 w-9 rounded-md" /> {/* Next Icon */}
      </div>

      <Skeleton className="h-4 w-24 mt-4" />

      <div className="flex space-x-4 mt-6">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  );
}