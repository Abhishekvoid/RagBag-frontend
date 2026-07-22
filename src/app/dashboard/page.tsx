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

const SIDEBAR_WIDTH = 300; // px — fixed notebook panel width (Zen-style, collapsible)

const MOBILE_TABS: { id: MobileTab; label: string; icon: typeof Library }[] = [
  { id: "sources", label: "Sources", icon: Library },
  { id: "chat", label: "Chat", icon: MessagesSquare },
  { id: "study", label: "Study", icon: Sparkles },
];

export default function DashboardPage() {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 1024px)", true);
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");

  // Zen-style collapsible notebook panel
  const [collapsed, setCollapsed] = useState(false);
  const [peeking, setPeeking] = useState(false);
  const collapse = () => { setCollapsed(true); setPeeking(false); };
  const expand = () => { setCollapsed(false); setPeeking(false); };

  // Restore + persist collapsed preference
  useEffect(() => {
    if (localStorage.getItem("sw-notebook-collapsed") === "1") setCollapsed(true);
  }, []);
  useEffect(() => {
    localStorage.setItem("sw-notebook-collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  // Cmd/Ctrl+B toggles the panel (Zen shortcut)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setPeeking(false);
        setCollapsed((c) => !c);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
      <Header
        sidebarCollapsed={collapsed}
        onToggleSidebar={() => { setPeeking(false); setCollapsed((c) => !c); }}
      />

      <div className="min-h-0 flex-1 overflow-hidden">
        {isDesktop ? (
          <div className="relative flex h-full w-full">
            {/* Notebook panel — in flow, animates to 0 width when collapsed */}
            <div
              className="relative z-20 h-full shrink-0 overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ width: collapsed ? 0 : SIDEBAR_WIDTH }}
            >
              <div style={{ width: SIDEBAR_WIDTH }} className="h-full">
                <NotebookSidebar onCollapse={collapse} />
              </div>
            </div>

            {/* Center + Studio — resizable between themselves */}
            <div className="min-w-0 flex-1">
              <Split
                direction="horizontal"
                sizes={[68, 32]}
                minSize={[380, 300]}
                gutterSize={10}
                className="flex h-full w-full"
              >
                <div className="flex min-w-0 flex-col overflow-hidden">
                  <ContentPanel />
                </div>
                <div className="flex min-w-0 flex-col overflow-hidden">
                  <StudioPanel />
                </div>
              </Split>
            </div>

            {/* Collapsed affordances: edge hover trigger + floating peek overlay (toggle lives in the Header) */}
            {collapsed && (
              <>
                {/* Left-edge hover zone reveals the peek overlay */}
                <div
                  className="absolute inset-y-0 left-0 z-30 w-3"
                  onMouseEnter={() => setPeeking(true)}
                />

                {/* Floating hover-peek overlay */}
                <div
                  onMouseLeave={() => setPeeking(false)}
                  className={cn(
                    "absolute inset-y-2 left-2 z-40 overflow-hidden rounded-2xl border border-border bg-popover/95 shadow-[0_32px_80px_-24px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    peeking
                      ? "translate-x-0 opacity-100"
                      : "pointer-events-none -translate-x-[112%] opacity-0",
                  )}
                  style={{ width: SIDEBAR_WIDTH }}
                >
                  <NotebookSidebar floating onPin={expand} />
                </div>
              </>
            )}
          </div>
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
