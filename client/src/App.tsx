import { useEffect } from "react";
import { useState } from "react";
import {BrowserRouter as Router, Switch, Route} from "react-router-dom"
import { setAccessToken } from "./accessToken";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PrivateRoute from "./PrivateRoute";

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:4000/refresh_token", {
      credentials: "include",
      method: "POST"
    }).then(async res => {
      const {accessToken} = await res.json();
      setAccessToken(accessToken);
      setLoading(false);
    })
  });
  if (loading) {
    return <div>Loading...</div>
  }
  return (
    <div >
      <header className="header">
        <h1>V Rooms</h1>
      </header>
      <Router>
        <Switch>
          <Route exact path="/" component={LandingPage} />
          <Route exact path="/register" component={Register} />
          <Route exact path="/login" component={Login} />
          <PrivateRoute exact path="/dashboard" component={Dashboard} />
        </Switch>
      </Router>
    </div>
  )
}

export default App;
