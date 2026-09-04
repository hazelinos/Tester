import { useState, useEffect } from 'react';

export const useIsMobile = () => {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handle = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);
  return mobile;
};
