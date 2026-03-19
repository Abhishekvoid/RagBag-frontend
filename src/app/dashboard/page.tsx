// src/app/dashboard/page.tsx

"use client";

import Split from "react-split";
import { Header } from "@/components/dashboard/Header/Header";
import { NotebookSidebar } from "@/components/dashboard/SideBar/NotebookSidebar";
import { ContentPanel } from "@/components/dashboard/ContentPanel/ContentPanel";
import { StudioPanel } from "@/components/dashboard/StudioPanel/StudioPanel";
import { useEffect } from "react";
import { useNotebookStore } from "@/lib/store/useNotebook";


export default function DashboardPage() {

  useEffect(() => {
    useNotebookStore.getState().initWebSocket();
  }, []);
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