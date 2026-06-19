// src/app/dashboard/page.tsx

"use client";

import Split from "react-split";
import { Header } from "@/components/dashboard/Header/Header";
import { NotebookSidebar } from "@/components/dashboard/SideBar/NotebookSidebar";
import { ContentPanel } from "@/components/dashboard/ContentPanel/ContentPanel";
import { StudioPanel } from "@/components/dashboard/StudioPanel/StudioPanel";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNotebookStore } from "@/lib/store/useNotebook";
import { getAccessToken, setAccessToken } from "@/lib/authToken";


export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    useNotebookStore.getState().initWebSocket();
  }, []);

  // On a hard reload the in-memory access token is gone; silently restore the
  // session from the httpOnly refresh cookie via the BFF before data calls run.
  useEffect(() => {
    if (getAccessToken()) return;
    (async () => {
      const r = await fetch("/api/auth/refresh", { method: "POST" });
      if (r.ok) {
        const { access } = await r.json();
        setAccessToken(access);
        useNotebookStore.getState().initWebSocket();
      } else {
        router.push("/auth/login");
      }
    })();
  }, [router]);
  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Split
          direction="horizontal"
          sizes={[20, 55, 25]} 
          minSize={100} 
          gutterSize={10} 
          className="flex h-full w-full"
        >
        
          <div className="flex flex-col overflow-hidden">
            <NotebookSidebar />
          </div>
          <div className="flex flex-col overflow-hidden">
            <ContentPanel />
          </div>
          <div className="flex flex-col overflow-hidden">
            <StudioPanel />
          </div>
        </Split>
      </div>
    </div>
  );
}