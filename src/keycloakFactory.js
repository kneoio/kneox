import Keycloak from 'keycloak-js';

const cfg = {
    url: 'http://localhost:9087',
    realm: 'test-realm',
    clientId: 'test-client'
};

const keycloakInst = new Keycloak(cfg);

export default keycloakInst;
