import {
  MdAccountBalanceWallet,
  MdBarChart,
  MdDevices,
  MdHome,
  MdLocationOn,
  MdLock,
  MdPerson,
} from "react-icons/md";

import BMS from "solution/building/main";
import FMS from "solution/farm/main";
import { Icon } from "@chakra-ui/react";
import MainDashboard from "views/admin/default";
import NFTMarketplace from "views/admin/marketplace";
import ProfileSettings from "components/profile/ProfileSettings";
import React from "react";
import Solution from "solution/Solution";
import Superadmin from "views/admin/superadmin";
import Test from "test";
import UserManangement from "components/userManagement/UserManagement";

// Admin Imports

const routes = [
  // {
  //   name: "Admin",
  //   layout: "/admin",
  //   path: "/adminmain",
  //   icon: <Icon as={MdPerson} width="20px" height="20px" color="inherit" />,
  //   component: AdminMain, // Note: Use the component, not the function name
  // },

  {
    name: "Main Dashboard",
    layout: "/admin",
    path: "/default",
    icon: <Icon as={MdHome} width="20px" height="20px" color="inherit" />,
    component: MainDashboard,
  },
  {
    name: "Device Management",
    layout: "/admin",
    path: "/nft-marketplace",
    icon: <Icon as={MdDevices} width="20px" height="20px" color="inherit" />,
    component: NFTMarketplace,
    secondary: true,
  },
  {
    name: "Solutions",
    layout: "/admin",
    icon: <Icon as={MdBarChart} width="20px" height="20px" color="inherit" />,
    path: "/data-tables",
    component: Solution,
  },
  {
    layout: "/admin",

    path: "/solutionmain/bms",
    component: BMS,
  },
  {
    layout: "/admin",

    path: "/test",
    component: Test,
  },

  {
    name: "Tenant Mangement", // name: "RTL Admin",
    layout: "/admin",
    path: "/superadmin", // path: "/rtl-default",
    icon: <Icon as={MdPerson} width="20px" height="20px" color="inherit" />,
    component: Superadmin,
  },
  {
    layout: "/admin",
    // name: "Profile Settings",
    path: "/profileSettings",
    component: ProfileSettings,
  },
  {
    name: "User Manangement", // name: "RTL Admin",
    layout: "/admin",
    path: "/usermanangement", // path: "/rtl-default",
    icon: <Icon as={MdPerson} width="20px" height="20px" color="inherit" />,
    component: UserManangement,
  },
];

export default routes;
