import Keycloak from 'keycloak-js';

const cfg = {
    url: 'https://auth.semantyca.com',
    realm: 'mixpla',
    clientId: 'mixpla_web' 
};

const keycloakInst = new Keycloak(cfg);

export default keycloakInst;