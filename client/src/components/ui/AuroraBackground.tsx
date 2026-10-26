import React from 'react';

export const AuroraBackground: React.FC = () => (
  <>
    <div className="aurora" aria-hidden="true">
      <div className="aurora__orb aurora__orb--violet" />
      <div className="aurora__orb aurora__orb--mint" />
      <div className="aurora__orb aurora__orb--coral" />
      <div className="aurora__grid" />
      <div className="aurora__vignette" />
    </div>
    <div className="grain" aria-hidden="true" />
  </>
);
