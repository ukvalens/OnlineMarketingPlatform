import { useState, useEffect } from 'react';

const BREAKPOINTS = { sm: 480, md: 768, lg: 900, xl: 1024, xxl: 1280 };

export default function useBreakpoint() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    let raf;
    const handle = () => { raf = requestAnimationFrame(() => setWidth(window.innerWidth)); };
    window.addEventListener('resize', handle);
    return () => { window.removeEventListener('resize', handle); cancelAnimationFrame(raf); };
  }, []);

  return {
    width,
    isMobile:  width <= BREAKPOINTS.sm,
    isTablet:  width > BREAKPOINTS.sm  && width <= BREAKPOINTS.lg,
    isDesktop: width > BREAKPOINTS.lg,
    below: (bp) => width <= (BREAKPOINTS[bp] ?? bp),
    above: (bp) => width >  (BREAKPOINTS[bp] ?? bp),
  };
}
