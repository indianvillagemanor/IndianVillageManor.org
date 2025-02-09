"use client";

import { useState } from "react";
import Image from "next/image";
import ivmGreen from "@/public/ivm_green.png"

const menuStyle = {
  position: "absolute" as const,
  top: "6px",
  right: "6px",
  cursor: "pointer",
  color: "#f0f0f0",
  padding: "0px",
  margin: "0px",
};

const overlayStyle = {
  position: "fixed" as const,
  top: "36px",
  right: 1,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 50,
};

const menuContentStyle = {
  backgroundColor: "#00693f",
  color: "#f0f0f0",
  padding: "20px",
  borderBottomLeftRadius: "8px",
  borderBottomRightRadius: "8px",
  borderLeft: "1px solid #f0f0f0",
  borderRight: "1px solid #f0f0f0",
  borderBottom: "1px solid #f0f0f0",
};


const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  padding: '0px',
  paddingBottom: '1px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 50
};

const headerImg = {
  width: "100%",
  height: "36px",
}


const SiteMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  }

  return (
    <header style={headerStyle}>
      <Image
        src={ivmGreen}
        alt="ivm"
        style={headerImg} />
      <div style={menuStyle} onClick={toggleMenu} >
        &#9776; Menu
      </div>
      {isOpen && (
        <div style={overlayStyle} onClick={toggleMenu}>
          <div style={menuContentStyle} onClick={(e) => e.stopPropagation()}>
            <ul>
              <li><a href="#home" onClick={closeMenu}>Home</a></li>
              <li><a href="#floorplans" onClick={closeMenu}>Floor Plans</a></li>
              <li><a href="#contact" onClick={closeMenu}>Contact</a></li>
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}

export default SiteMenu;

