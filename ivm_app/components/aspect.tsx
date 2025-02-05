"use client";

import React, { ReactNode, useEffect } from 'react'

const Aspect = ({ children }: { children: ReactNode }) => {

  useEffect(() => {
    const updateAspect = () => {
      const aspect = window.innerWidth / window.innerHeight;
      document.documentElement.style.setProperty('--aspect', aspect.toString());
    };

    // Set initial aspect ratio
    updateAspect();

    // Update aspect ratio on resize
    window.addEventListener('resize', updateAspect);

    // Cleanup event listener on component unmount
    return () => window.removeEventListener('resize', updateAspect);
  }, []);


  return (
    <div>{children}</div>

  )

}

export default Aspect