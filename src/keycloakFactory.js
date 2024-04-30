import Keycloak from 'keycloak-js';

const cfg = {
    url: 'https://auth.keypractica.com',
    realm: 'keypractica_auth',
    clientId: 'keypractica_projects',
    onLoad: 'check-sso',
    pkceMethod: 'S256',
    scope: 'openid offline_access'
};

const keycloakInst = new Keycloak(cfg);

export default keycloakInst;
