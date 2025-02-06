"use client";

import GridCell from "@/components/grid_cell";
import GridGraphic from "@/components/grid_graphic";
import GridHeader from "@/components/grid_header";
import GridPhoto from "@/components/grid_photo";
import GridSection from "@/components/grid_section";
import GridText from "@/components/grid_text";
import { WindowContext } from "@/components/window_context";
import Image from "next/image";
import { useState } from "react";

const windowAspect = () => (window.innerWidth / window.innerHeight);

export default function Home() {

  const [aspect, setAspect] = useState(windowAspect());

  window.addEventListener("resize", () => {
    setAspect(windowAspect());
  });

  const portrait = aspect < 1;
  const rowHeight = portrait ? 16 : (16 + 16 * (aspect - 1));

  return (
    <WindowContext.Provider value={{ portrait, rowHeight }}>
      <GridSection rows={27}>
        <GridGraphic gridCell={[1, 1, 6, 1]} src="IVM Logo Design_Black_24 0225_t.png" alt="IVM Logo" />
        <GridHeader gridCell={[1, 2, 2, 2]}>INDIAN VILLAGE MANOR</GridHeader>
        <GridText gridCell={[8, 1, 8, 1]}>
          Experience spacious, elegant living at Indian Village Manor, a true gem on Detroit's Gold Coast Waterfront. Enjoy the beauty of the private riverfront park, stay in shape in the full featured gym, and get more out of life with proximity to Belle Isle park and a quick hop down Jefferson Avenue to Downtown Detroit.
        </GridText>
        <GridPhoto gridCell={[4, 2, 23, 2]} src="Entrance.jpg" alt="IVM Entrance" />
        <GridPhoto gridCell={[18, 1, 9, 1]} src="RiverfrontW.jpg" alt="IVM Riverfront West View" />
      </GridSection>
    </WindowContext.Provider>
  );
}
