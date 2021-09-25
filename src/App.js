import Map from "./Map";
import { Switch, Route } from "react-router-dom";
import LoginPage from "./LoginPage";

function App() {
  return (
    <div id="loginDiv" className="App">
      <Switch>
        <Route exact path="/">
          <LoginPage />
        </Route>
        <Route exact path="/Map">
          <Map />
        </Route>
      </Switch>
    </div>
  );
}

export default App;
