"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { getUser, clearUser } from "@/utils/storage";
import { setAccessToken } from "@/lib/authToken";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { BrandLogo } from "@/components/ui/kit";
import { LogOut, PanelLeft } from "lucide-react";

interface HeaderProps {
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function Header({ sidebarCollapsed, onToggleSidebar }: HeaderProps = {}) {
  const router = useRouter();
  const user = getUser();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setAccessToken(null);
      clearUser();
      router.push("/auth/login");
    }
  };

  const name = user?.name || "User";
  const initial = name.trim().charAt(0).toUpperCase() || "U";

  return (
    <header className="glass sticky top-0 z-50 flex h-14 items-center justify-between border-b px-4">
      <div className="flex items-center gap-1">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={sidebarCollapsed ? "Show notebook" : "Hide notebook"}
            title="Toggle notebook  (Ctrl/Cmd+B)"
            className="active-press hidden size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:flex"
          >
            <PanelLeft className="size-[18px]" />
          </button>
        )}
        <BrandLogo className="text-base" />
      </div>

      <div className="flex items-center gap-1.5">
        <div className="mr-1 hidden items-center gap-2 rounded-full border border-border bg-secondary/50 py-1 pl-1 pr-3 sm:flex">
          <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[12px] font-semibold text-primary-foreground">
            {initial}
          </span>
          <span className="text-[13px] font-medium text-foreground/90">{name}</span>
        </div>
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
