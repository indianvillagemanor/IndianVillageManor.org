"use client";

import Image from "next/image";
import { useState } from "react";

const windowAspect = () => (window.innerWidth / window.innerHeight);

export default function Home() {

  const [aspect, setAspect] = useState(windowAspect());

  window.addEventListener("resize", () => {
    setAspect(windowAspect());
  });

  const portraitMode = aspect < 1;

  const gridCols = portraitMode ? "grid-cols-2" : "grid-cols-3";
  const fullSpan = portraitMode ? "col-span-2" : "col-span-3";
  // const rowHeight = portraitMode ? 24 : (16 + 16 * (aspect - 1))
  // const heightStyle = { height: rowHeight + "px" };

  return (
    <div className={"grid gap-1 " + gridCols}>
      {/* <div className={fullSpan} style={heightStyle}> */}
      <div className={fullSpan + " grid-row"}>
        {/* Item 1 */}
        <img src="/ivm_green.png" alt="ivm" className="w-full h-full" />
      </div>
      <div> Item 2</div>
      <div> Item 3</div>
      <div> Item 4</div>
    </div >
  );
}
