"use client";

import GridCell from "@/components/grid_cell";
import GridGraphic from "@/components/grid_graphic";
import GridHeader from "@/components/grid_header";
import GridPhoto from "@/components/grid_photo";
import GridText from "@/components/grid_text";
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
  return (
    <div style={gridContainer}>
      <GridGraphic gridArea={[1, 1, 6, 1]} src="IVM Logo Design_Black_24 0225_t.png" alt="IVM Logo" />
      <GridHeader gridArea={[1, 2, 2, 2]}>INDIAN VILLAGE MANOR</GridHeader>
      <GridPhoto gridArea={[4, 2, 23, 2]} src="Entrance.jpg" alt="IVM Entrance" />
      <GridText gridArea={[7, 1, 11, 1]}>
        Experience spacious, elegant living at Indian Village Manor, a true gem on Detroit's Gold Coast Waterfront. Enjoy the beauty of the private riverfront park, stay in shape in the full featured gym, and get more out of life with proximity to Belle Isle park and a quick hop down Jefferson Avenue to Downtown Detroit.
      </GridText>
      <GridPhoto gridArea={[18, 1, 9, 1]} src="RiverfrontW.jpg" alt="IVM Riverfront West View" />
    </div >
  );
}
