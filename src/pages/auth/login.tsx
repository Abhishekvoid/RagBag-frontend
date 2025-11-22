import { LoginForm } from "@/components/auth/LoginForm";
import Link from "next/link";
import { GrainOverlay } from "@/components/ui/GrainOverlay";

export default function LoginPage() {
  return (
    <div className="h-screen w-screen flex items-center justify-center relative overflow-hidden bg-background">
      
      {/* 1. AMBIENT BACKGROUND GLOWS */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-primary/20 rounded-full blur-[120px] animate-pulse opacity-60 pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700 opacity-60 pointer-events-none" />

      {/* 2. TEXTURE OVERLAY */}
      <GrainOverlay intensity="medium" className="opacity-40" />
     
      {/* 3. GLASS CONTAINER */}
      <div className="relative z-10 w-full max-w-[520px] px-4"> {/* Width fixed to 320px */}
        
        <div className="backdrop-blur-xl bg-card/40 border border-white/20 shadow-2xl rounded-xl p-1 overflow-hidden"> {/* Sharper borders */}
          
          {/* Inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          
          <div className="relative bg-black/40 rounded-lg p-5"> {/* Darker background, tighter padding */}
            
            <div className="flex flex-col items-center mb-5"> 
               <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center mb-3 backdrop-blur-md border border-white/10 shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
               </div>
               <h1 className="text-lg font-bold tracking-tight text-foreground">Welcome Back</h1>
               <p className="text-[11px] text-muted-foreground mt-1">Enter your credentials to access your notebook</p>
            </div>

            <LoginForm />
            
            <div className="text-center mt-4"> 
              <p className="text-[10px] text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/register"
                  className="font-medium text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
                >
                  Create one here
                </Link>
              </p>
            </div>
          </div>
        </div>
        
        <p className="text-center text-[9px] text-muted-foreground/40 mt-4 tracking-widest">
          SECURE ENCRYPTED CONNECTION
        </p>
      </div>
    </div>
  );
}