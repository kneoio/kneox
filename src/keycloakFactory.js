import Keycloak from 'keycloak-js';

const cfg = {
    //url: 'https://auth.kneo.io/auth', // Corrected URL
    url: 'https://auth.kneo.io',
    realm: 'kneo',
    clientId: 'kneo_primary',
    // checkLoginIframe: false, // See note below
    // onLoad: 'login-required' // This is overridden by main.js anyway
};

const keycloakInst = new Keycloak(cfg);

export default keycloakInst;