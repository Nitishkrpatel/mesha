// Sidebar.js

import { NavLink } from "react-router-dom";
import React from "react";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <NavLink to="/tenant-management">Tenant Management</NavLink>
      <NavLink to="/create-solution">Create Solution</NavLink>
      <NavLink to="/tree-view">Tree View</NavLink>
    </div>
  );
};

export default Sidebar;
