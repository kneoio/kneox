import Keycloak from 'keycloak-js';

const cfg = {
    url: 'https://auth.keypractica.com/auth',
    realm: 'keypractica_auth',
    clientId: 'keypractica_projects',
    onLoad: 'login-required',  // This matches the KeycloakOptions interface
    pkceMethod: 'S256',
    scope: 'openid'
};

const keycloakInst = new Keycloak(cfg);

export default keycloakInst;
