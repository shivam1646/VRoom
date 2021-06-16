import React from 'react';
import ReactDOM from 'react-dom';
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
  ApolloLink
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import App from './App';
import { getAccessToken, setAccessToken } from "./accessToken";
import { TokenRefreshLink } from "apollo-link-token-refresh";
import jwtDecode, { JwtPayload } from "jwt-decode";

const httpLink = createHttpLink({
  uri: "http://localhost:4000/graphql",
  credentials: "include",
});

const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  const accessToken = getAccessToken();
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: accessToken ? `Bearer ${accessToken}` : "",
    }
  }
});

const client = new ApolloClient({
    link: ApolloLink.from([
      new TokenRefreshLink({
        accessTokenField: "accessToken",
        isTokenValidOrUndefined: () => {
          const accessToken = getAccessToken();
          if (!accessToken) {
            return true;
          }

          try {
            const {exp} = jwtDecode<JwtPayload>(accessToken);
            if (!exp || Date.now() >= exp*1000) {
              return false;
            }
            return true;
          } catch (error) {
            return false;
          }
        },
        fetchAccessToken: () => {
          return fetch("http://localhost:4000/refresh_token", {
            credentials: "include",
            method: "POST"
          })
        },
        handleFetch: accessToken => {
          setAccessToken(accessToken);
        },
        handleError: err => {
           // full control over handling token fetch Error
           console.warn('Your refresh token is invalid. Try to relogin');
           console.error(err);
        }
      }), authLink, httpLink
    ]),
    // caches query results after fetching them
    cache: new InMemoryCache(),
})

ReactDOM.render(
  <React.StrictMode>
    {/* connects apollo client to react. Similar to React's Context.Provider, 
    ApolloProvider wraps your React app and places Apollo Client on the context,
    which enables you to access it from anywhere in your component tree */}
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

