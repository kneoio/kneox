import { createApp } from 'vue';
import App from './App.vue';
import keycloakInst from "./keycloakFactory";

const keycloak = keycloakInst;

keycloak.init({
    scope: 'openid',
    onLoad: 'login-required',
    pkceMethod: 'S256'
}).then((authenticated: boolean) => {
    if (authenticated) {
        console.log('User authenticated');
    } else {
        console.error('Authentication failed - proceeding without authentication');
    }
}).catch((error: any) => {
    console.error('Failed to initialize Keycloak - proceeding without authentication', error);
}).finally(() => {
    const app = createApp(App);
    app.provide('keycloak', keycloak);
    app.mount('#app');
});
