const authConfig = {
  domain: process.env.REACT_APP_AUTH0_DOMAIN,
  clientId: process.env.REACT_APP_AUTH0_CLIENT_ID,
  audience: process.env.REACT_APP_AUTH0_AUDIENCE,
  redirectUri: window.location.origin,
};
console.log("Auth0 Domain:", process.env.REACT_APP_AUTH0_DOMAIN);
console.log("Auth0 Client ID:", process.env.REACT_APP_AUTH0_CLIENT_ID);

export default authConfig;
