import React, { useState } from "react";

import Keycloak from "keycloak-js";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();

    const keycloak = new Keycloak({
      url: "http://192.168.31.236:8085",
      realm: "iot_realm",
      clientId: "iot_realm_client",
    });

    try {
      await keycloak.init({ onLoad: "check-sso" });

      await keycloak.login({
        username: username,
        password: password,
      });

      alert(keycloak);
      // Successful login
      // window.location.href = "YOUR_REDIRECT_URL";
    } catch (error) {
      // Handle login error
      console.error("Login failed:", error);
      alert("Login failed. Please try again.");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <label htmlFor="username">Username:</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <br />
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <br />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
