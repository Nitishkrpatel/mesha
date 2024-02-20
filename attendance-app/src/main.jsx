import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";

import App from "./App.jsx";
import { AuthProvider } from "./context/AuthProvider.jsx";
import React from "react";
import ReactDOM from "react-dom/client";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
