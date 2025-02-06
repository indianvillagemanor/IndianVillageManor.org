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
      <GridSection rows={23}>
        <GridPhoto gridCell={[1, 1, 23, 1]} src="Interior3.jpg" alt="IVM Interior #3" />
        <GridText gridCell={[1, 2, 11, 2]}>
          In the mid 1920s IVM advertisements used the phrase “Detroit’s Most Exclusive Apartment Building”.  A lot has happened since the building was converted into condos in 1998.  Many of the original common area elements remain. Each condo unit has taken on the identity of its owner.  Many walls have been literally removed and floor plans modified to efficiently utilize the spacious units. Some new kitchens and bathrooms have been installed. Other cosmetic changes have been made to address current needs, adding color, texture and features to make it feel like home.
        </GridText>
        <GridPhoto gridCell={[12, 2, 12, 2]} src="Interior1.jpg" alt="IVM Interior #1" />
      </GridSection>
      <GridSection rows={23} green>
        <GridText gridCell={[1, 1, 10, 1]}>
          The community has a riverfront garden, dog yard, on-site maintenance/manager, 24 hour monitored entry, private parking, community laundry room/lounge, dry cleaning drop off and pick up to your door, exercise club, 2 main elevators and 5 service elevators, & a small conference room.
        </GridText>
        <GridPhoto gridCell={[1, 2, 13, 2]} src="WeightRoom.jpg" alt="IVM Weight Room" />
        <GridPhoto gridCell={[11, 1, 13, 1]} src="FirstFloor.jpg" alt="IVM First Floor" />
        <GridPhoto gridCell={[14, 2, 10, 2]} src="RiverfrontE.jpg" alt="IVM Riverfront East View" />
      </GridSection>
      <GridSection rows={22} green>
        <GridGraphic gridCell={[6, 1, 12, 1]} src="FloorPlanABMN_white.png" alt="IVM Floor Plan for A,B,M and N units" />
        <GridText gridCell={[1, 2, 12, 1]}>
          These well appointed and maintained condominiums offer 3 distinct layouts (2,300-2,500 sq. ft. 11 room maximum). Each unit expresses a variety of different tastes and styles yet maintain the original architectural charm.
        </GridText>
        <GridGraphic gridCell={[1, 3, 12, 1]} src="FloorPlanCDKL_white.png" alt="IVM Floor Plan for C,D,K and L units" />
        <GridGraphic gridCell={[13, 2, 12, 2]} src="FloorPlanEFGH_white.png" alt="IVM Floor Plan for E,F,G and H units" />
      </GridSection>
      <GridSection rows={24} green>
        <GridPhoto gridCell={[1, 1, 10, 1]} src="Interior5.jpg" alt="IVM Interior #5" />
        <GridPhoto gridCell={[1, 2, 10, 2]} src="Interior6.jpg" alt="IVM Interior #6" />
        <GridPhoto gridCell={[11, 1, 14, 2]} src="Interior4.jpg" alt="IVM Interior #4" />
        <GridPhoto gridCell={[11, 3, 14, 1]} src="Exterior.jpg" alt="IVM Front Exterior" />
      </GridSection>
      <GridSection rows={20}>
        <GridPhoto gridCell={[1, 1, 20, 2]} src="ivm_front_door.jpg" alt="IVM Front Door" />
        <GridHeader gridCell={[3, 3, 2, 1]}>Contact</GridHeader>
        <GridText gridCell={[7, 3, 4, 1]} className="text-lg">
          8120 East Jefferson Avenue<br />
          Detroit, MI 48214<br />
          313-824-7704
        </GridText>
        <GridText gridCell={[12, 3, 2, 1]} className="text-lg underline">
          <a href="mailto:IVManor@outlook.com">IVManor@outlook.com</a>
        </GridText>
      </GridSection>
    </WindowContext.Provider>
  );
}
