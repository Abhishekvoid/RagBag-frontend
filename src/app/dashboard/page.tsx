// src/app/dashboard/page.tsx

"use client";

import Split from "react-split";
import { Header } from "@/components/dashboard/Header/Header";
import { NotebookSidebar } from "@/components/dashboard/SideBar/NotebookSidebar";
import { ContentPanel } from "@/components/dashboard/ContentPanel/ContentPanel";
import { StudioPanel } from "@/components/dashboard/StudioPanel/StudioPanel";


export default function DashboardPage() {
  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <Header />
   
      <Split
        direction="horizontal"
        sizes={[20, 55, 25]} 
        minSize={100} 
        gutterSize={10} 
        className="flex h-full w-full"
      >
       
        <div className="overflow-auto">
          <NotebookSidebar />
        </div>
        <div className="overflow-auto">
          <ContentPanel />
        </div>
        <div className="overflow-auto">
          <StudioPanel />
        </div>
      </Split>
    </div>
  );
}