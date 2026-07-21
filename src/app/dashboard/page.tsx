// src/app/dashboard/page.tsx

"use client";

import Split from "react-split";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Library, MessagesSquare, Sparkles } from "lucide-react";
import { Header } from "@/components/dashboard/Header/Header";
import { NotebookSidebar } from "@/components/dashboard/SideBar/NotebookSidebar";
import { ContentPanel } from "@/components/dashboard/ContentPanel/ContentPanel";
import { StudioPanel } from "@/components/dashboard/StudioPanel/StudioPanel";
import { useNotebookStore } from "@/lib/store/useNotebook";
import { getAccessToken, refreshAccessToken } from "@/lib/authToken";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Grain } from "@/components/ui/kit";
import { cn } from "@/lib/utils";

type MobileTab = "sources" | "chat" | "study";

const MOBILE_TABS: { id: MobileTab; label: string; icon: typeof Library }[] = [
  { id: "sources", label: "Sources", icon: Library },
  { id: "chat", label: "Chat", icon: MessagesSquare },
  { id: "study", label: "Study", icon: Sparkles },
];

export default function DashboardPage() {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 1024px)", true);
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");

  useEffect(() => {
    useNotebookStore.getState().initWebSocket();
    useNotebookStore.getState().seedInFlightIngestions();
  }, []);

  // On a hard reload the in-memory access token is gone; silently restore the
  // session from the httpOnly refresh cookie via the BFF before data calls run.
  useEffect(() => {
    if (getAccessToken()) return;
    (async () => {
      try {
        await refreshAccessToken();
        useNotebookStore.getState().initWebSocket();
        useNotebookStore.getState().seedInFlightIngestions();
      } catch {
        router.push("/auth/login");
      }
    })();
  }, [router]);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background text-foreground">
      <Grain />
      <Header />

      <div className="min-h-0 flex-1 overflow-hidden">
        {isDesktop ? (
          <Split
            direction="horizontal"
            sizes={[22, 53, 25]}
            minSize={[240, 380, 280]}
            gutterSize={10}
            className="flex h-full w-full"
          >
            <div className="flex min-w-0 flex-col overflow-hidden">
              <NotebookSidebar />
            </div>
            <div className="flex min-w-0 flex-col overflow-hidden">
              <ContentPanel />
            </div>
            <div className="flex min-w-0 flex-col overflow-hidden">
              <StudioPanel />
            </div>
          </Split>
        ) : (
          <div className="flex h-full flex-col">
            <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
              <div className={cn("h-full w-full", mobileTab === "sources" ? "block" : "hidden")}>
                <NotebookSidebar />
              </div>
              <div className={cn("h-full w-full", mobileTab === "chat" ? "block" : "hidden")}>
                <ContentPanel />
              </div>
              <div className={cn("h-full w-full", mobileTab === "study" ? "block" : "hidden")}>
                <StudioPanel />
              </div>
            </div>

            <nav className="flex shrink-0 border-t border-border bg-card">
              {MOBILE_TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setMobileTab(id)}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors active-press",
                    mobileTab === id ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon size={19} />
                  {label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
