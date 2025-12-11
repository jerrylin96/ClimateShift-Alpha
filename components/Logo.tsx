
import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8" }) => {
  return (
    <svg 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      aria-label="ClimateShift Alpha Logo"
    >
      {/* 
        The "Alpha" (A)
        Aggressive, dominant, geometric.
        Sharp edges (butt/miter) for a "Manrope" industrial aesthetic.
        Coordinates perfectly symmetrical around x=20.
      */}
      <path 
        d="M9 36L20 12L31 36" 
        stroke="currentColor" 
        strokeWidth="5" 
        strokeLinecap="butt" 
        strokeLinejoin="miter" 
      />
      
      {/* Heavy Crossbar - Butt caps for precise geometric fit */}
      <path 
        d="M13.5 26H26.5" 
        stroke="currentColor" 
        strokeWidth="5" 
        strokeLinecap="butt" 
      />

      {/* 
        The "Barrier" Lines
        Hard edges, perfectly symmetrical framing.
        Parallel to the legs: (5,25)->(14,5) matches slope.
      */}
      <path 
        d="M5 25L14 5" 
        stroke="currentColor" 
        strokeWidth="5" 
        strokeLinecap="butt"
      />
      <path 
        d="M35 25L26 5" 
        stroke="currentColor" 
        strokeWidth="5" 
        strokeLinecap="butt"
      />
    </svg>
  );
};
