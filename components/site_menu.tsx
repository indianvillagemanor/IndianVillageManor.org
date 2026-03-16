"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

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
  right: 0,
  bottom: 0,
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "flex-start",
  paddingTop: "36px",
  zIndex: 50,
  backgroundColor: "rgba(0, 0, 0, 0.3)", // Semi-transparent background to indicate modal state
};

const menuContentStyle = {
  backgroundColor: "#00693f",
  color: "#f0f0f0",
  padding: "0px",
  borderBottomLeftRadius: "8px",
  borderBottomRightRadius: "8px",
  borderLeft: "1px solid #f0f0f0",
  borderRight: "1px solid #f0f0f0",
  borderBottom: "1px solid #f0f0f0",
  minWidth: "200px",
};

const menuItemStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "14px 20px",
  textAlign: "left",
  color: "#f0f0f0",
  textDecoration: "none",
  borderBottom: "1px solid rgba(240, 240, 240, 0.2)",
  transition: "background-color 0.2s",
};

const menuButtonStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "14px 20px",
  textAlign: "left",
  color: "#f0f0f0",
  backgroundColor: "transparent",
  border: "none",
  borderBottom: "1px solid rgba(240, 240, 240, 0.2)",
  cursor: "pointer",
  font: "inherit",
  transition: "background-color 0.2s",
};

const menuItemHoverStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.1)",
};

const menuInfoStyle: React.CSSProperties = {
  padding: "14px 20px",
  fontSize: "0.9em",
  fontStyle: "italic",
  color: "#d0d0d0",
  borderBottom: "1px solid rgba(240, 240, 240, 0.2)",
};

const menuDividerStyle: React.CSSProperties = {
  margin: "0",
  border: "none",
  borderTop: "2px solid rgba(240, 240, 240, 0.3)",
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0px',
  paddingBottom: '1px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 50
};

const headerImg = {
  width: "100%",
  height: "36px",
}


const SiteMenu = () => {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [committees, setCommittees] = useState<Array<{ id: string; name: string; description: string }>>([]);
  const [hasNewsletters, setHasNewsletters] = useState(false);

  // Check for published newsletters (public — no auth required)
  useEffect(() => {
    fetch('/api/newsletters')
      .then(res => res.json())
      .then(data => {
        if (data.newsletters && data.newsletters.length > 0) {
          setHasNewsletters(true);
        }
      })
      .catch(() => {
        // Non-critical; newsletter menu item simply won't appear
      });
  }, []);

  // Fetch committees when user is authenticated
  useEffect(() => {
    if (status === "authenticated" && session) {
      fetch('/api/committees/visible')
        .then(res => res.json())
        .then(data => {
          if (data.committees) {
            setCommittees(data.committees);
          }
        })
        .catch(error => {
          console.error('Failed to fetch committees:', error);
        });
    } else {
      setCommittees([]);
    }
  }, [status, session]);

  // Open menu automatically only on fresh login (not every page load)
  useEffect(() => {
    if (status === "authenticated" && session) {
      // Check if this is a fresh login
      const justLoggedIn = sessionStorage.getItem('justLoggedIn');
      if (justLoggedIn === 'true') {
        setIsOpen(true);
        // Clear the flag so menu doesn't auto-open on subsequent page navigations
        sessionStorage.removeItem('justLoggedIn');
      }
    }
  }, [status, session]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  }

  const handleOverlayClick = () => {
    toggleMenu();
  };

  const handleMenuContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleLogout = async () => {
    closeMenu();
    await signOut({ callbackUrl: '/' });
  };

  const getMenuItemStyle = (itemKey: string) => ({
    ...menuItemStyle,
    ...(hoveredItem === itemKey ? menuItemHoverStyle : {}),
  });

  const getMenuButtonStyle = (itemKey: string) => ({
    ...menuButtonStyle,
    ...(hoveredItem === itemKey ? menuItemHoverStyle : {}),
  });

  return (
    <header style={headerStyle}>
      <Image
        src="/ivm_green.png"
        alt="ivm"
        width={64}
        height={64}
        style={headerImg}
        priority
      />
      <div style={menuStyle} onClick={toggleMenu} >
        &#9776; Menu
      </div>
      {isOpen && (
        <div style={overlayStyle} onClick={handleOverlayClick}>
          <div style={menuContentStyle} onClick={handleMenuContentClick}>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              <li style={{ padding: 0 }}>
                <Link
                  href="/#home"
                  onClick={closeMenu}
                  style={getMenuItemStyle('home')}
                  onMouseEnter={() => setHoveredItem('home')}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  Home
                </Link>
              </li>
              <li style={{ padding: 0 }}>
                <Link
                  href="/#floorplans"
                  onClick={closeMenu}
                  style={getMenuItemStyle('floorplans')}
                  onMouseEnter={() => setHoveredItem('floorplans')}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  Floor Plans
                </Link>
              </li>
              <li style={{ padding: 0 }}>
                <Link
                  href="/#contact"
                  onClick={closeMenu}
                  style={getMenuItemStyle('contact')}
                  onMouseEnter={() => setHoveredItem('contact')}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  Contact
                </Link>
              </li>

              {/* Newsletter link — visible to all users when published newsletters exist */}
              {hasNewsletters && (
                <li style={{ padding: 0 }}>
                  <Link
                    href="/newsletters"
                    onClick={closeMenu}
                    style={getMenuItemStyle('newsletters')}
                    onMouseEnter={() => setHoveredItem('newsletters')}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    Newsletters
                  </Link>
                </li>
              )}

              {/* Committee links for authenticated users */}
              {session && committees.length > 0 && (
                <>
                  <li style={{ padding: 0 }}><hr style={menuDividerStyle} /></li>
                  {committees.map((committee) => (
                    <li key={committee.id} style={{ padding: 0 }}>
                      <Link
                        href={`/committees/${committee.id}`}
                        onClick={closeMenu}
                        style={getMenuItemStyle(`committee-${committee.id}`)}
                        onMouseEnter={() => setHoveredItem(`committee-${committee.id}`)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        {committee.name}
                      </Link>
                    </li>
                  ))}
                </>
              )}

              {/* Admin links for dbadmin */}
              {session?.user?.roles?.includes('dbadmin') && (
                <>
                  <li style={{ padding: 0 }}><hr style={menuDividerStyle} /></li>
                  <li style={{ padding: 0 }}>
                    <Link
                      href="/committees"
                      onClick={closeMenu}
                      style={getMenuItemStyle('committees')}
                      onMouseEnter={() => setHoveredItem('committees')}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      Committees
                    </Link>
                  </li>
                  <li style={{ padding: 0 }}>
                    <Link
                      href="/admin/console"
                      onClick={closeMenu}
                      style={getMenuItemStyle('admin-console')}
                      onMouseEnter={() => setHoveredItem('admin-console')}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      Admin Console
                    </Link>
                  </li>
                </>
              )}

              {/* Verifier link */}
              {session?.user?.roles?.includes('verifier') && (
                <>
                  <li style={{ padding: 0 }}><hr style={menuDividerStyle} /></li>
                  <li style={{ padding: 0 }}>
                    <Link
                      href="/admin/verify"
                      onClick={closeMenu}
                      style={getMenuItemStyle('verify')}
                      onMouseEnter={() => setHoveredItem('verify')}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      Verify Users
                    </Link>
                  </li>
                </>
              )}

              <li style={{ padding: 0 }}><hr style={menuDividerStyle} /></li>
              {status === "loading" ? (
                <li style={{ ...menuInfoStyle, padding: "14px 20px" }}>Loading...</li>
              ) : session ? (
                <>
                  <li style={{ padding: 0 }}>
                    <Link
                      href="/dashboard"
                      onClick={closeMenu}
                      style={getMenuItemStyle('dashboard')}
                      onMouseEnter={() => setHoveredItem('dashboard')}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li style={{ padding: 0 }}>
                    <Link
                      href="/events"
                      onClick={closeMenu}
                      style={getMenuItemStyle('events')}
                      onMouseEnter={() => setHoveredItem('events')}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      Calendar
                    </Link>
                  </li>
                  <li style={{ padding: 0 }}>
                    <Link
                      href="/profile"
                      onClick={closeMenu}
                      style={getMenuItemStyle('profile')}
                      onMouseEnter={() => setHoveredItem('profile')}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      My Profile
                    </Link>
                  </li>
                  <li style={{ ...menuInfoStyle, borderBottom: "none" }}>
                    Signed in as: {session.user?.firstName} {session.user?.lastName}
                  </li>
                  <li style={{ padding: 0 }}>
                    <button
                      onClick={handleLogout}
                      style={getMenuButtonStyle('logout')}
                      onMouseEnter={() => setHoveredItem('logout')}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li style={{ padding: 0 }}>
                    <Link
                      href="/auth/login"
                      onClick={closeMenu}
                      style={getMenuItemStyle('login')}
                      onMouseEnter={() => setHoveredItem('login')}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      Login
                    </Link>
                  </li>
                  <li style={{ padding: 0 }}>
                    <Link
                      href="/register"
                      onClick={closeMenu}
                      style={getMenuItemStyle('register')}
                      onMouseEnter={() => setHoveredItem('register')}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      Register
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      )
      }
    </header >
  );
}

export default SiteMenu;
