import { RouterProvider, createBrowserRouter } from "react-router-dom";

import Activities from "./pages/Activities";
import AuthContext from "./context/AuthContext";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Login from "./pages/account/login/Login";
import RealTime from "./pages/RealTime";
import Reports from "./pages/Reports";
import RootLayout from "./pages/Root";
import Settings from "./pages/Settings";
import Teams from "./pages/Teams";
import TimeAndAttendance from "./pages/TimeAndAttendance";
import { useContext } from "react";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { path: "", element: <Dashboard /> },
      { path: "real-time", element: <RealTime /> },
      { path: "employees", element: <Employees /> },
      { path: "teams", element: <Teams /> },
      { path: "time&attendance", element: <TimeAndAttendance /> },
      { path: "activities", element: <Activities /> },
      { path: "reports", element: <Reports /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);

function App() {
  const { isLoggedIn } = useContext(AuthContext);
  return <>{isLoggedIn ? <RouterProvider router={router} /> : <Login />}</>;
}

export default App;
