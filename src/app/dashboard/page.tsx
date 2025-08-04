"use client";

import { Header } from "@/components/dashboard/Header";
import { NotebookSidebar } from "@/components/dashboard/NotebookSidebar";
import { ContentPanel } from "@/components/dashboard/ContentlPanel";
import { StudioPanel } from "@/components/dashboard/StudioPanel";


export default function DashboardPage() {
  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-grow grid grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* Each panel is a self-contained component */}
        <NotebookSidebar />
        <ContentPanel />
        <StudioPanel />
      </main>
    </div>
  );
}