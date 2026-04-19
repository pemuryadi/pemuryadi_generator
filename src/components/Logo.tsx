import React from 'react';

export default function Logo({ className = "w-10 h-10" }: { className?: string }) {
  // High-quality SVG Data URL for a professional 'P' logo (Gold on Black)
  const logoDataUrl = `data:image/svg+xml;base64,${btoa(`
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#000000"/>
      <defs>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#B8860B;stop-opacity:1" />
        </linearGradient>
      </defs>
      <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="60" fill="url(#goldGradient)">P</text>
      <rect x="5" y="5" width="90" height="90" rx="15" fill="none" stroke="url(#goldGradient)" stroke-width="2" stroke-opacity="0.3"/>
    </svg>
  `)}`;

  return (
    <div className={`relative group ${className}`}>
      <img 
        src={logoDataUrl} 
        alt="PEMURYADI Logo" 
        className="w-full h-full rounded-lg object-cover shadow-[0_0_20px_rgba(255,215,0,0.3)] border border-amber-500/30 transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(255,215,0,0.5)]"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
    </div>
  );
}
