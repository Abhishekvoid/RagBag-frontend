import React from 'react';
import { cn } from '@/lib/utils';

interface GrainOverlayProps {
  intensity?: 'subtle' | 'medium' | 'strong';
  className?: string;
  animated?: boolean;
}

export function GrainOverlay({ 
  intensity = 'subtle', 
  className,
  animated = false 
}: GrainOverlayProps) {
  const intensityMap = {
    subtle: 'opacity-[0.02]',
    medium: 'opacity-[0.04]', 
    strong: 'opacity-[1]',
  };

  const grainSvg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><filter id='grain'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23grain)' opacity='0.1'/></svg>`;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 select-none",
        intensityMap[intensity],
        animated && "animate-pulse",
        className
      )}
      style={{
        backgroundImage: `url("${grainSvg}")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '100px 100px',
      }}
    />
  );
}
