
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
        Geometry:
        - Symmetrical construction centered at x=20
        - Apex at y=5, Base at y=38
        - Slope: ~0.36
      */}
      <path 
        fillRule="evenodd" 
        clipRule="evenodd" 
        d="M20 5L32 38H28L24 26H16L12 38H8L20 5ZM20 16L22 22H18L20 16Z" 
        fill="currentColor" 
      />
      
      {/* 
        The "Barrier" Wings (Shards)
        Refinement:
        - Top at y=2 (Fixed as requested)
        - Bottom at y=24 (Raised from y=30 to make them shorter)
        - Horizontal position adjusted closer to center (Gap ~4 units)
        - Slope perfectly matched to A (-8/22 ~= -0.36)
      */}
      <path 
        d="M5 24L13 2H17L9 24H5Z" 
        fill="currentColor" 
        opacity="0.9"
      />
      <path 
        d="M35 24L27 2H23L31 24H35Z" 
        fill="currentColor" 
        opacity="0.9"
      />
    </svg>
  );
};
