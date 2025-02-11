"use client";

import React, { ReactNode, useEffect, useState } from 'react'
import { WindowContext } from './window_context';

interface WindowSize {
  width: number;
  height: number;
}

interface WindowWithSizeProps {
  children: ReactNode;
}


const WindowWithSize: React.FC<WindowWithSizeProps> = ({ children }) => {
  const [windowSize, setWindowSize] = useState<WindowSize>();

  const updateWindowSize = () => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  }


  useEffect(() => {
    updateWindowSize();
    window.addEventListener("resize", updateWindowSize);
    return () => window.removeEventListener("resize", updateWindowSize);
  }, []);

  const portrait = windowSize ? windowSize.width <= 768 : true;
  const rowHeight = windowSize ? (portrait ? 16 : (16 + 16 * (windowSize.width - 768) / 1152)) : 16;

  if (windowSize) {
    return (
      <WindowContext.Provider value={{ portrait, rowHeight }}>
        {children}
      </WindowContext.Provider>
    )
  } else {
    return (<div> </div>);
  }
}

export default WindowWithSize