"use client";

import { useState, ReactNode } from "react";
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

const listItemStyle = {
  // listStyleType: "none",
  padding: "6px",
  cursor: "pointer",
}


const LI = ({ children }: { children: ReactNode }) => {
  return <li style={listItemStyle}>{children}</li>;
}


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

  const loggedIn = false;

  return (
    <header style={headerStyle}>
      <Image
        src={ivmGreen}
        alt="ivm"
        style={headerImg}
        priority
        sizes="100vw"
      />
      <div style={menuStyle} onClick={toggleMenu} >
        &#9776; Menu
      </div>
      {isOpen && (
        <div style={overlayStyle} onClick={toggleMenu}>
          <div style={menuContentStyle} onClick={(e) => e.stopPropagation()}>
            <ul>
              <LI><a href="/#home" onClick={closeMenu}>Home</a></LI>
              <LI><a href="/#floorplans" onClick={closeMenu}>Floor Plans</a></LI>
              <LI><a href="/#contact" onClick={closeMenu}>Contact</a></LI>
              <LI><hr /></LI>
              {
                loggedIn
                  ?
                  <>
                    <LI><a href="/calendar" onClick={closeMenu}>Calendar</a></LI>
                    <LI><a href="/newsletter" onClick={closeMenu}>Newsletter</a></LI>
                    <LI><a href="/tickets" onClick={closeMenu}>Tickets</a></LI>
                    <LI><hr /></LI>
                    <LI><a href="/auth/logout" onClick={closeMenu}>Logout</a></LI>
                  </>
                  : <LI><a href="/auth/login" onClick={closeMenu}>Login</a></LI>
              }
            </ul>
          </div>
        </div>
      )
      }
    </header >
  );
}

export default SiteMenu;

