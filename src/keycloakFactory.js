import Keycloak from 'keycloak-js';

const cfg = {
    url: 'https://auth.keypractica.com',
    realm: 'keypractica_auth',
    clientId: 'keypractica_projects'
};

const keycloakInst = new Keycloak(cfg);

export default keycloakInst;
