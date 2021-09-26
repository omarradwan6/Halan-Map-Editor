import React, { useState } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";
import { saveToken } from "./Functions/saveToken";
import { login } from "./Functions/apiRequests";
import "./styling.css";

function LoginPage(props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  let history = useHistory();

  const onChangeUsername = (e) => {
    setUsername(e.target.value);
  };

  const onChangePassword = (e) => {
    setPassword(e.target.value);
  };

  //Send api request with username and password. Save token and then switch to map screen if successful
  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      let response = await login(username, password);
      saveToken(response.data.token);
      history.push("/map");
    } catch (error) {
      console.log(error);
      alert("invalid username or password.");
    }
  };

  return (
    <div
      id="loginDiv"
      className="container-fluid d-flex justify-content-center align-items-center"
    >
      <form id="form">
        <div
          style={{ letterSpacing: "0.25rem", color: "white" }}
          className="text-center"
        >
          <h3>Halan Map Editor</h3>
        </div>

        <div className="form-group mt-2">
          <input
            type="text"
            class="form-control"
            id="username"
            onChange={onChangeUsername}
            placeholder="Username"
          />
        </div>
        <div class="form-group mt-2">
          <input
            type="password"
            class="form-control"
            id="password"
            onChange={onChangePassword}
            placeholder="Password"
          />
        </div>
        <div className="d-flex justify-content-center">
          <button
            id="loginButton"
            onClick={onSubmit}
            type="submit"
            class="btn btn-primary"
          >
            Login
          </button>
        </div>
      </form>
    </div>
  );
}

export default LoginPage;
