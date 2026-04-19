import React from 'react';

export default function HeroBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" style={{ background: '#0a0a0f' }}>
      {/* Dark gradient overlay to match reference lighting */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#050505] via-[#11111a] to-[#050508] opacity-80" />
      
      {/* Isometric Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.8) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.8) 1px, transparent 1px)
          `,
          backgroundSize: '4rem 4rem',
          transform: 'perspective(1000px) rotateX(60deg) scale(2) translateY(-20%)',
          transformOrigin: 'top center',
        }}
      />

      {/* Neon Light Rays / Ambient glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1000px] aspect-square mix-blend-screen opacity-70 border-none">
        {/* Red Glow */}
        <div 
          className="absolute top-1/4 right-1/4 w-[40%] h-[40%] rounded-full bg-[#ff3333] blur-[100px] opacity-40 animate-pulse" 
          style={{ animationDuration: '4s' }} 
        />
        {/* Cyan Glow */}
        <div 
          className="absolute bottom-1/4 left-1/4 w-[40%] h-[40%] rounded-full bg-[#00ffcc] blur-[100px] opacity-30 animate-pulse" 
          style={{ animationDuration: '6s' }} 
        />
        {/* Yellow/Warm Glow */}
        <div 
          className="absolute top-1/3 left-1/3 w-[50%] h-[50%] rounded-full bg-[#ffaa00] blur-[120px] opacity-20 animate-pulse" 
          style={{ animationDuration: '5s' }} 
        />
      </div>

      {/* Vignette Overlay for cinematic focal point */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#050508_100%)] opacity-90" />
      
      {/* Scanline texture (subtle) */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(wrap, rgba(255,255,255,0) 50%, rgba(255,255,255,1) 50%)',
          backgroundSize: '100% 4px'
        }}
      />
    </div>
  );
}
