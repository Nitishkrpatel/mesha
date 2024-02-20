import "./App.css";

import { BrowserRouter, Route, Routes } from "react-router-dom";

import Dashboard from "./components/dashboard/Dashboard";
import Employees from "./components/employees/Employees";
// import Login from "./components/account/login/Login";
import Realtime from "./components/realTime/Realtime";
import Sidenav from "./components/sidebar/Sidenav";

function App() {
  return (
    <div>
      {/* <Login /> */}
      <Sidenav />
    </div>
    // <div>
    //   <BrowserRouter>
    //     <Routes>
    //       <Route exact path="/" element={<Dashboard />} />
    //       <Route path="/real_time" element={<Realtime />} />
    //       <Route path="/contact" element={<Employees />} />
    //     </Routes>
    //   </BrowserRouter>
    // </div>
  );
}

export default App;
