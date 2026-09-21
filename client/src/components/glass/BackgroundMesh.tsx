import React from 'react';

export const BackgroundMesh: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Primary Indigo/Violet ambient blob */}
      <div
        className="absolute -top-24 -left-20 w-80 h-80 rounded-full bg-indigo-600/15 blur-[90px] animate-blob"
        style={{ animationDelay: '0s' }}
      />

      {/* Cyan/Teal glow on top right */}
      <div
        className="absolute top-20 -right-24 w-80 h-80 rounded-full bg-cyan-500/12 blur-[95px] animate-blob"
        style={{ animationDelay: '4s' }}
      />

      {/* Emerald/Mint subtle glow in center-bottom */}
      <div
        className="absolute top-1/2 left-1/3 -translate-x-1/2 w-96 h-96 rounded-full bg-emerald-500/10 blur-[110px] animate-blob"
        style={{ animationDelay: '8s' }}
      />

      {/* Rose/Pink glow at the bottom */}
      <div
        className="absolute -bottom-20 -right-16 w-80 h-80 rounded-full bg-rose-500/10 blur-[90px] animate-blob"
        style={{ animationDelay: '6s' }}
      />

      {/* Dark vignette gradient overlay */}
      <div className="absolute inset-0 bg-radial-vignette opacity-70" />
    </div>
  );
};
