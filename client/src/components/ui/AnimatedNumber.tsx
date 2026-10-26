import React, { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}

const defaultFormat = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  format = defaultFormat,
  duration = 0.9,
  className = '',
}) => {
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);

  useEffect(() => {
    if (!Number.isFinite(value)) return;

    if (reducedMotion) {
      previous.current = value;
      setDisplay(value);
      return;
    }

    const from = previous.current;
    previous.current = value;

    const controls = animate(from, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (next) => setDisplay(next),
    });

    return () => controls.stop();
  }, [value, duration, reducedMotion]);

  return <span className={className}>{format(display)}</span>;
};
