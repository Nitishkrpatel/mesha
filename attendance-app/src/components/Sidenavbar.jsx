import IconImg from "../assets/icon.svg";
import { NavLink } from "react-router-dom";
import PropTypes from "prop-types";
import classes from "./Sidenavbar.module.css";
// import { useState } from "react";

const Sidenavbar = ({ onNavLinkClick }) => {
  // const [selectedNavLink, setSelectedNavLink] = useState(null);

  const handleNavLinkClick = (name) => {
    // setSelectedNavLink(name);
    onNavLinkClick(name);
  };

  return (
    <aside>
      <h1 className={classes.logo}>LOGO</h1>
      <ul className={classes.list}>
        <li>
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? classes.active : undefined
            }
            end
            onClick={() => handleNavLinkClick("Dashboard")}
          >
            <img src={IconImg} alt="icon" />
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/real-time"
            className={({ isActive }) =>
              isActive ? classes.active : undefined
            }
            onClick={() => handleNavLinkClick("RealTime")}
          >
            <img src={IconImg} alt="icon" />
            RealTime
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/employees"
            className={({ isActive }) =>
              isActive ? classes.active : undefined
            }
            onClick={() => handleNavLinkClick("Employees")}
          >
            <img src={IconImg} alt="icon" />
            Employees
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/teams"
            className={({ isActive }) =>
              isActive ? classes.active : undefined
            }
            onClick={() => handleNavLinkClick("Teams")}
          >
            <img src={IconImg} alt="icon" />
            Teams
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/time&attendance"
            className={({ isActive }) =>
              isActive ? classes.active : undefined
            }
            onClick={() => handleNavLinkClick(" Time And Attendance")}
          >
            <img src={IconImg} alt="icon" />
            Time And Attendance
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/activities"
            className={({ isActive }) =>
              isActive ? classes.active : undefined
            }
            onClick={() => handleNavLinkClick("Activities")}
          >
            <img src={IconImg} alt="icon" />
            Activities/Logs
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/reports"
            className={({ isActive }) =>
              isActive ? classes.active : undefined
            }
            onClick={() => handleNavLinkClick("Reports")}
          >
            <img src={IconImg} alt="icon" />
            Reports
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              isActive ? classes.active : undefined
            }
            onClick={() => handleNavLinkClick("Settings")}
          >
            <img src={IconImg} alt="icon" />
            Settings
          </NavLink>
        </li>
      </ul>
    </aside>
  );
};

Sidenavbar.propTypes = {
  onNavLinkClick: PropTypes.func,
};

export default Sidenavbar;
