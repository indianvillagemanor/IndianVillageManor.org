"use client";

import GridCell from "@/components/grid_cell";
import GridGraphic from "@/components/grid_graphic";
import GridHeader from "@/components/grid_header";
import GridPhoto from "@/components/grid_photo";
import GridText from "@/components/grid_text";
import Image from "next/image";
import { useState } from "react";

const windowAspect = () => (window.innerWidth / window.innerHeight);

export default function Home() {

  const [aspect, setAspect] = useState(windowAspect());

  window.addEventListener("resize", () => {
    setAspect(windowAspect());
  });

  const isPortrait = aspect < 1;

  const rowHeight = isPortrait ? 16 : (16 + 16 * (aspect - 1));

  const aspectColumns = isPortrait ? 1 : 3

  const gridStyle = (rows: number) => (
    {
      display: "grid",
      gridTemplateColumns: `repeat(${aspectColumns}, minmax(0, 1fr))`,
      gridTemplateRows: `repeat(${rows}, ${rowHeight}px)`,
      gridGap: "2px",
      padding: "8px",
    }
  )

  return (
    <div style={gridStyle(27)}>
      <GridGraphic gridCell={[1, 1, 6, 1]} src="IVM Logo Design_Black_24 0225_t.png" alt="IVM Logo" portrait={isPortrait} />
      <GridHeader gridCell={[1, 2, 2, 2]} portrait={isPortrait} >INDIAN VILLAGE MANOR</GridHeader>
      <GridText gridCell={[8, 1, 8, 1]} portrait={isPortrait} >
        Experience spacious, elegant living at Indian Village Manor, a true gem on Detroit's Gold Coast Waterfront. Enjoy the beauty of the private riverfront park, stay in shape in the full featured gym, and get more out of life with proximity to Belle Isle park and a quick hop down Jefferson Avenue to Downtown Detroit.
      </GridText>
      <GridPhoto gridCell={[4, 2, 23, 2]} src="Entrance.jpg" alt="IVM Entrance" portrait={isPortrait} />
      <GridPhoto gridCell={[18, 1, 9, 1]} src="RiverfrontW.jpg" alt="IVM Riverfront West View" portrait={isPortrait} />
    </div >
  );
}
