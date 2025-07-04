import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 64 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle */}
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="url(#gradient1)"
        stroke="currentColor"
        strokeWidth="2"
      />
      
      {/* Water flow lines */}
      <path
        d="M16 24 Q24 20 32 24 Q40 28 48 24"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        opacity="0.8"
      />
      <path
        d="M16 32 Q24 28 32 32 Q40 36 48 32"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M16 40 Q24 36 32 40 Q40 44 48 40"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        opacity="0.4"
      />
      
      {/* Center "e" for eFlow */}
      <text
        x="32"
        y="38"
        textAnchor="middle"
        fontSize="20"
        fontWeight="bold"
        fill="currentColor"
        fontFamily="system-ui, sans-serif"
      >
        e
      </text>
      
      {/* Gradient definition */}
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(59, 130, 246, 0.1)" />
          <stop offset="100%" stopColor="rgba(147, 51, 234, 0.1)" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default Logo;
