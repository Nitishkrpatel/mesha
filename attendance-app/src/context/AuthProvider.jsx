import AuthContext from "./AuthContext";
import PropTypes from "prop-types";
import { useState } from "react";

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setLoggedIn] = useState(false);

  const login = () => {
    // Perform your authentication logic here
    // For simplicity, let's assume authentication is successful
    setLoggedIn(true);
  };

  const logout = () => {
    // Perform logout logic here
    setLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
