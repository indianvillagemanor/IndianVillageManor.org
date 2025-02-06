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
      <GridSection rows={28}>
        <GridPhoto gridCell={[1, 1, 24, 1]} src="Interior3.jpg" alt="IVM Interior #3" />
        <GridText gridCell={[1, 2, 12, 2]}>
          In the mid 1920s IVM advertisements used the phrase “Detroit’s Most Exclusive Apartment Building”.  A lot has happened since the building was converted into condos in 1998.  Many of the original common area elements remain. Each condo unit has taken on the identity of its owner.  Many walls have been literally removed and floor plans modified to efficiently utilize the spacious units. Some new kitchens and bathrooms have been installed. Other cosmetic changes have been made to address current needs, adding color, texture and features to make it feel like home.
        </GridText>
        <GridPhoto gridCell={[12, 2, 13, 2]} src="Interior1.jpg" alt="IVM Interior #1" />
      </GridSection>
      <GridSection rows={28} green>
        <GridPhoto gridCell={[1, 1, 24, 1]} src="Interior3.jpg" alt="IVM Interior #3" />
        <GridText gridCell={[1, 2, 12, 2]}>
          In the mid 1920s IVM advertisements used the phrase “Detroit’s Most Exclusive Apartment Building”.  A lot has happened since the building was converted into condos in 1998.  Many of the original common area elements remain. Each condo unit has taken on the identity of its owner.  Many walls have been literally removed and floor plans modified to efficiently utilize the spacious units. Some new kitchens and bathrooms have been installed. Other cosmetic changes have been made to address current needs, adding color, texture and features to make it feel like home.
        </GridText>
        <GridPhoto gridCell={[12, 2, 13, 2]} src="Interior1.jpg" alt="IVM Interior #1" />
      </GridSection>
    </WindowContext.Provider>
  );
}
