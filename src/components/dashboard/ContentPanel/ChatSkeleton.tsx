import { Skeleton } from "@/components/ui/skeleton";

export function ChatSkeleton() {
  return (
    <div className="flex flex-col space-y-8 p-4 h-full overflow-hidden animate-in fade-in duration-700">
      
      {/* AI Message Mimic (Left) */}
      <div className="flex gap-4 w-full max-w-[80%]">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" /> 
        <div className="space-y-2 w-full">
          <div className="flex items-center gap-2">
             <Skeleton className="h-4 w-20 opacity-50" />
             <Skeleton className="h-3 w-12 opacity-30" />
          </div>
          <Skeleton className="h-24 w-full rounded-2xl rounded-tl-none bg-muted/20" /> 
          <div className="space-y-1.5 pt-1">
             <Skeleton className="h-3 w-[90%] opacity-20" />
             <Skeleton className="h-3 w-[75%] opacity-20" />
          </div>
        </div>
      </div>

      {/* User Message Mimic (Right) */}
      <div className="flex gap-4 w-full max-w-[80%] ml-auto flex-row-reverse">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" /> 
        <div className="space-y-2 w-full flex flex-col items-end">
          <div className="flex items-center gap-2">
             <Skeleton className="h-3 w-12 opacity-30" />
             <Skeleton className="h-4 w-16 opacity-50" />
          </div>
          {/* Simulating the Primary Color of user messages */}
          <Skeleton className="h-12 w-[60%] rounded-2xl rounded-tr-none bg-primary/5" /> 
        </div>
      </div>

       {/* AI Message Mimic 2 (Left - Longer) */}
      <div className="flex gap-4 w-full max-w-[85%]">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" /> 
        <div className="space-y-2 w-full">
          <Skeleton className="h-4 w-24 opacity-50" /> 
          <Skeleton className="h-40 w-full rounded-2xl rounded-tl-none bg-muted/20" /> 
           <div className="space-y-2 pt-2">
             <Skeleton className="h-3 w-full opacity-20" />
             <Skeleton className="h-3 w-[80%] opacity-20" />
             <Skeleton className="h-3 w-[60%] opacity-20" />
          </div>
        </div>
      </div>
    </div>
  );
}