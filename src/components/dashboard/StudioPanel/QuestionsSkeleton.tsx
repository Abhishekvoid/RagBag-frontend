import { Skeleton } from "@/components/ui/skeleton";

export function QuestionsSkeleton() {
  return (
    <div className="mt-4 space-y-6 animate-in fade-in duration-500">
      {/* Header Placeholder */}
      <div className="space-y-2 mb-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64 opacity-60" />
      </div>
      
      {/* Question Items */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="border-b border-border/50 pb-6 last:border-b-0 last:pb-0 space-y-3">
          <div className="space-y-2">
             {/* "Q1: ..." Line */}
             <div className="flex gap-2">
                <Skeleton className="h-5 w-8 shrink-0" /> 
                <Skeleton className="h-5 w-3/4" />
             </div>
             
             {/* "A: ..." Block */}
             <div className="pl-10 space-y-2 mt-2">
                <Skeleton className="h-4 w-full opacity-50" />
                <Skeleton className="h-4 w-5/6 opacity-50" />
             </div>
          </div>
        </div>
      ))}
    </div>
  );
}