import React, { useEffect, useState } from "react";

import Keycloak from "keycloak-js";
import KeycloakContext from "./KeycloakContext";
import { Keycloak_URL } from "networks";

const KeycloakProvider = ({ children }) => {
  const [keycloak, setKeycloak] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const initKeycloak = async () => {
      try {
        const keycloakInstance = new Keycloak({
          realm: "iot_realm",
          // url: "http://192.168.31.249:8085",
          url: Keycloak_URL(),
          clientId: "iot_realm_client",
        });

        console.log("Keycloak instance:", keycloakInstance);

        const authenticated = await keycloakInstance.init({
          onLoad: "login-required",
          checkLoginIframe: true,
          // onLoad: "check-sso",
          // checkLoginIframe: false,
        });

        console.log("Keycloak authentication result:", authenticated);

        if (authenticated) {
          setKeycloak(keycloakInstance);
          setAuthenticated(true);
          // Load user profile after authentication
          const profile = await keycloakInstance.loadUserProfile();
          setUserProfile(profile);
        }
      } catch (error) {
        console.error("Error initializing Keycloak:", error);
      }
    };

    initKeycloak();
  }, []);

  const logout = () => {
    if (keycloak) {
      keycloak.logout();
    }
  };

  return (
    <>
      {keycloak && authenticated && userProfile &&(
        <KeycloakContext.Provider
          value={{ keycloak, authenticated, logout, userProfile }}
        >
          {children}
        </KeycloakContext.Provider>
      )}
    </>
  );
};

export default KeycloakProvider;
