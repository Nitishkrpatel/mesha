import "./Login.css";

import { React, useState } from "react";

import login from "../../../assets/login.svg";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({}); // To store validation errors

  const validateForm = () => {
    const errors = {};

    if (!username.trim()) {
      errors.username = "Username is required";
    }

    if (!password.trim()) {
      errors.password = "Password is required";
    }

    setErrors(errors);
    return Object.keys(errors).length === 0; // Form is valid if there are no errors
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (validateForm()) {
      // Add your authentication logic here (e.g., API call or validation)
      // For demonstration purposes, we'll simply log the data
      console.log("Username:", username);
      console.log("Password:", password);

      // Clear the form after submission
      setUsername("");
      setPassword("");
      setErrors({});
    }
  };
  return (
    <div>
      <div className="row">
        <div className="col-sm-12 col-md-7 login_img">
          <img src={login} alt="login_img" />
        </div>
        <div className="col-sm-12 col-md-5 login_form">
          {/* <div className="text-center mt-5"> */}
            <h2>Login</h2>
          {/* </div> */}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="username" className="form-label">
                Username:
              </label>
              <input
                type="text"
                id="username"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Password:
              </label>
              <input
                type="password"
                id="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {errors.password && <p className="error">{errors.password}</p>}
            </div>
            <div className="text-center">
              <button type="submit" className="btn login_btn">Login</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
