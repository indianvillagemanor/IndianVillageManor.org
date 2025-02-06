"use client";

import { useState } from "react";

const menuStyle = {
  position: "absolute" as const,
  top: "10px",
  right: "10px",
  cursor: "pointer",
  color: "#f0f0f0",
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

const SiteMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <div style={menuStyle} onClick={toggleMenu} >
        &#9776; Menu
      </div>
      {isOpen && (
        <div style={overlayStyle} onClick={toggleMenu}>
          <div style={menuContentStyle} onClick={(e) => e.stopPropagation()}>
            <h2>Menu</h2>
            <ul>
              <li>Home</li>
              <li>About</li>
              <li>Contact</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

export default SiteMenu;

