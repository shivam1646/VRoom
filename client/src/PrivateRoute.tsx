import React from "react";
import { Redirect, Route } from "react-router-dom";
import { useLoggedInUserQuery } from "./generated/graphql";

interface Props {
    component: any,
    exact: any,
    path: any,
}

function PrivateRoute({component, ...rest}: Props) {
    const {data, loading} = useLoggedInUserQuery({fetchPolicy:"network-only"});

    let body = null;

    if (loading) {
        body = <div>Loading....</div>;
    } else {
        body = <Route
        render={({ location, history }) =>
          data && data.loggedInUser ? (
            React.createElement(component, {history})
          ) : (
            <Redirect
              to={{
                pathname: "/login",
                state: { from: location }
              }}
            />
          )
        }
      />
    }
    return body;
}

export default PrivateRoute;