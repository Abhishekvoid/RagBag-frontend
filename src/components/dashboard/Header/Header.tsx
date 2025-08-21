"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { clearTokens } from "@/utils/storage"; 
// import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";


export function Header() {
  const router = useRouter();

  const user = { name: "Abhishek" }; 

  const handleLogout = () => {
    clearTokens();
    router.push("/auth/login");
  };

  return (
    <header className="bg-background border-b border-border flex items-center justify-between p-2 shadow-sm z-10 flex-shrink-0">
      <div className="flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
        <h1 className="text-lg font-bold text-foreground">StudyWise</h1>
      </div>
       {/* <ThemeSwitcher /> */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground hidden sm:inline">Welcome, {user.name}</span>
        <Button onClick={handleLogout} variant="secondary" size="sm">Logout</Button>
      </div>
    </header>
  );
}