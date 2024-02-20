import "./App.css";

import {
  NavLink,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";

import Chart from "./components/Chart";
import CreateSolutionComponent from "./components/CreateSolutionComponent";
import Login from "./components/Login";
import React from "react";
import TenantManagement from "./components/TenantManagement";
import TreeView from "./components/TreeView";
import WebsocketConnection from "./components/WebsocketConnection";

function App() {
  return (
    <Router>
      <div className="appContainer">
        <div className="sidebar">
          <NavLink to="tenant-management">Tenant Management</NavLink>
          <NavLink to="create-solution">Create Solution</NavLink>
          <NavLink to="tree-view">Tree View</NavLink>
          <NavLink to="chart">Chart</NavLink>
          <NavLink to="alerts">Alerts</NavLink>
          <NavLink to="login">Login</NavLink>
        </div>
        <div className="main-content">
          <Routes>
            <Route path="" element={<TenantManagement />} />
            <Route path="tenant-management" element={<TenantManagement />} />
            <Route
              path="create-solution"
              element={<CreateSolutionComponent />}
            />
            <Route path="tree-view" element={<TreeView />} />
            <Route path="chart" element={<Chart />} />
            <Route path="alerts" element={<WebsocketConnection />} />
            <Route path="login" element={<Login />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
