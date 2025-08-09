import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  // ✅ FIX: Add a 'children' prop to accept other components
  children?: React.ReactNode;
}

export function EmptyState({ icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="text-center p-4">
      <div className="mx-auto bg-muted rounded-full size-16 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <p className="text-muted-foreground mt-2 max-w-md mx-auto">{description}</p>
      {/* ✅ Render the children that are passed in (e.g., the Button) */}
      {children}
    </div>
  );
}