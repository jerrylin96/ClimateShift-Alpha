
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
        The "Alpha" (A) - Slightly Widened
        Geometry:
        - Symmetrical construction centered at x=20
        - Horizontal coordinates stretched by ~1.2x
      */}
      <path 
        fillRule="evenodd" 
        clipRule="evenodd" 
        d="M20 5L34.4 38H29.6L26 29H14L10.4 38H5.6L20 5ZM20 16L23.6 25H16.4L20 16Z" 
        fill="currentColor" 
      />
      
      {/* 
        The "Barrier" Wings (Shards) - Slightly Widened
        Refinement:
        - Coordinates stretched to match A
      */}
      <path 
        d="M2 24L11.6 2H16.4L6.8 24H2Z" 
        fill="white" 
        opacity="0.9"
      />
      <path 
        d="M38 24L28.4 2H23.6L33.2 24H38Z" 
        fill="white" 
        opacity="0.9"
      />
    </svg>
  );
};
