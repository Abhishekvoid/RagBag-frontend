import { RegisterForm } from "@/components/auth/RegisterForm";
import Link from "next/link";
import { GrainOverlay } from "@/components/ui/GrainOverlay";

export default function RegisterPage() {
  return (
    // 1. OUTER CONTAINER: Fixed height (h-screen), no body scroll
    <div className="h-screen w-screen flex items-center justify-center relative overflow-hidden bg-background">
      
      {/* AMBIENT BACKGROUND (Same as Login) */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-primary/20 rounded-full blur-[120px] animate-pulse opacity-60 pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700 opacity-60 pointer-events-none" />

      <GrainOverlay intensity="medium" className="opacity-40" />
     
      {/* 2. GLASS CONTAINER WRAPPER */}
      {/* We keep the width 500px, but limit height to 90% of screen and center it */}
      <div className="relative z-10 w-full max-w-[500px] px-4 flex flex-col max-h-[90vh]"> 
        
        {/* THE SCROLLABLE CARD */}
        {/* overflow-y-auto handles the scrolling if content is too tall */}
        <div className="backdrop-blur-xl bg-card/40 border border-white/20 shadow-2xl rounded-xl p-1 overflow-hidden flex flex-col">
          
          {/* Inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          
          {/* Content Container - This is where the scroll happens if needed */}
          <div className="relative bg-black/40 rounded-lg overflow-y-auto custom-scrollbar">
            <div className="p-6 sm:p-8">
              
              <div className="flex flex-col items-center mb-6">
                 <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-3 backdrop-blur-md border border-white/10 shadow-inner shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                 </div>
                 <h1 className="text-xl font-bold tracking-tight text-foreground">Create Account</h1>
                 <p className="text-sm text-muted-foreground mt-1 text-center">Join StudyWise today</p>
              </div>

              <RegisterForm />
              
              <div className="text-center mt-6">
                <p className="text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="font-medium text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer stays OUTSIDE the scrollable area so it's always visible at the bottom (optional) */}
        {/* Or keep it inside if you want it to scroll too. Here it is outside for stability. */}
        <p className="text-center text-[10px] text-muted-foreground/40 mt-4 tracking-widest shrink-0">
          SECURE ENCRYPTED CONNECTION
        </p>
      </div>
    </div>
  );
}