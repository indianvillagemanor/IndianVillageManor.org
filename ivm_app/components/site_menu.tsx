"use client";

import { useState } from "react";

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
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const menuContentStyle = {
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "8px",
};


const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  // backgroundColor: '#fff',
  padding: '0px',
  paddingBottom: '1px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 1000
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

  return (
    <header style={headerStyle}>
      <img src="/ivm_green.png" alt="ivm" style={headerImg} />
      <div style={menuStyle} onClick={toggleMenu} >
        &#9776; Menu
      </div>
      {isOpen && (
        <div style={overlayStyle} onClick={toggleMenu}>
          <div style={menuContentStyle} onClick={(e) => e.stopPropagation()}>
            <h2>Menu</h2>
            <ul>
              <li><a href="#home">Home</a></li>
              <li><a href="#floorplans">Floor Plans</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}

export default SiteMenu;

