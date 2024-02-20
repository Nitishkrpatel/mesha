import MainNavigation from "../components/MainNavigation";
import { Outlet } from "react-router-dom";
import Sidenavbar from "../components/Sidenavbar";
import { useState } from "react";

function RootLayout() {
  const [selectedNavLink, setSelectedNavLink] = useState(null);

  const handleNavLinkClick = (name) => {
    setSelectedNavLink(name);
  };
  return (
    <div className="layout">
      <Sidenavbar onNavLinkClick={handleNavLinkClick} />
      <main>
        <MainNavigation selectedNavLink={selectedNavLink} />
        <Outlet />
      </main>
    </div>
  );
}

export default RootLayout;
