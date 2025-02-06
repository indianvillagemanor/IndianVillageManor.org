"use client";

import Image from "next/image";
import { useState } from "react";

const windowAspect = () => (window.innerWidth / window.innerHeight);

const gridContainer = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gridTemplateRows: "repeat(27, var(--grid-row-height))",
  gridGap: "2px",
  padding: "8px",
}

export default function Home() {

  const [aspect, setAspect] = useState(windowAspect());

  window.addEventListener("resize", () => {
    setAspect(windowAspect());
  });

  const portraitMode = aspect < 1;

  // const gridCols = portraitMode ? "grid-cols-2" : "grid-cols-3";
  // const fullSpan = portraitMode ? "col-span-2" : "col-span-3";
  // const rowHeight = portraitMode ? 24 : (16 + 16 * (aspect - 1))
  // const heightStyle = { height: rowHeight + "px" };

  return (
    <div style={gridContainer}>
      <div style={{
        gridArea: "1 / 1 / 7 / 2"
      }} className="flex items-center justify-center">
        <img src="IVM Logo Design_Black_24 0225_t.png" alt="IVM Logo" className="max-h-full max-w-full object-scale-down" />
      </div>
      <div style={{
        gridArea: "1 / 2 / 3 / 4"
      }} className="flex items-center justify-center overflow-hidden">
        <h1 style={{
          fontSize: "clamp(1rem, 5vw, 4rem)"
        }}>INDIAN VILLAGE MANOR</h1>
      </div>
      <div style={{
        gridArea: "4 / 2 / 27 / 4"
      }} className="flex items-center justify-center overflow-hidden">
        <img src="Entrance.jpg" alt="IVM Entrance" className="h-full w-full object-cover" />
      </div>
      <div style={{
        gridArea: "7 / 1 / 18/ 2"
      }}>
        <p style={{
          fontSize: "clamp(1rem, 0.3vw, 2rem)"
        }} className="overflow-hidden">
          Experience spacious, elegant living at Indian Village Manor, a true gem on Detroit's Gold Coast Waterfront. Enjoy the beauty of the private riverfront park, stay in shape in the full featured gym, and get more out of life with proximity to Belle Isle park and a quick hop down Jefferson Avenue to Downtown Detroit.
        </p>
      </div>
      <div style={{
        gridArea: "18 / 1 / 27 / 2"
      }} className="flex items-center justify-center overflow-hidden">
        <img src="RiverfrontW.jpg" alt="IVM Riverfront West View" className="h-full w-full object-cover" />
      </div>
    </div >
  );
}
