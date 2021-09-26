import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { saveToken } from "./Functions/saveToken";

function Navbar() {

  // cancel token when signing out.
  const signOut = () => {
    saveToken(null);
  };

  return (
    <nav id="nav" class="navbar navbar-expand-lg">
      <div class="container-fluid">
        <a class="navbar-brand mx-2">Halan Map Editor</a>
        <Link
          to="/"
          class="btn"
          id="logout"
          onClick={signOut}
          data-bs-toggle="tooltip"
          data-bs-placement="top"
          title="Log Out"
        >
          <FontAwesomeIcon id="logOutIcon" icon={faSignOutAlt} width="25px"/>
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
