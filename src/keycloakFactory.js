import Keycloak from 'keycloak-js';

const cfg = {
    url: 'https://auth.kneo.io',
    realm: 'kneo',
    clientId: 'kneo_primary',
    checkLoginIframe: false,
};

const keycloakInst = new Keycloak(cfg);

export default keycloakInst;
