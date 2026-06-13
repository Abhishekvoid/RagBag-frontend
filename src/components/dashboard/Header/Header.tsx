"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { clearTokens, getUser } from "@/utils/storage";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { BookOpen, LogOut } from "lucide-react";

export function Header() {
  const router = useRouter();
  const user = getUser();

  const handleLogout = () => {
    clearTokens();
    router.push("/auth/login");
  };

  return (
    <header className="glass sticky top-0 z-50 flex items-center justify-between border-b px-4 h-12">
      <div className="flex items-center gap-2">
        <BookOpen size={18} className="text-primary" />
        <span className="text-h3 font-semibold tracking-tight">StudyWise</span>
        <span className="font-mono text-micro text-muted-foreground ml-1">
          {"// tutor"}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm text-muted-foreground hidden sm:inline mr-2">
          {user?.name || "User"}
        </span>
        <ThemeSwitcher />
        <Button
          onClick={handleLogout}
          variant="ghost"
          size="icon"
          aria-label="Log out"
          className="active-press text-muted-foreground hover:text-foreground"
        >
          <LogOut size={18} />
        </Button>
      </div>
    </header>
  );
}
