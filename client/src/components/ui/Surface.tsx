import React from 'react';

type SurfaceTone = 'panel' | 'solid' | 'inset';

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: SurfaceTone;
  padded?: boolean;
  children: React.ReactNode;
}

const toneClass: Record<SurfaceTone, string> = {
  panel: 'panel',
  solid: 'panel-solid',
  inset: 'panel-inset',
};

export const Surface: React.FC<SurfaceProps> = ({
  tone = 'panel',
  padded = true,
  className = '',
  children,
  ...props
}) => (
  <div className={`${toneClass[tone]} ${padded ? 'p-5' : ''} ${className}`} {...props}>
    {children}
  </div>
);
