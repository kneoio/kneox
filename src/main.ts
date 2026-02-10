import { createApp, reactive } from 'vue';
import App from "./App.vue";
import keycloakInst from "./keycloakFactory";
import router, { setupRouterGuard } from "./router";
import IconWrapper from "./components/helpers/IconWrapper.vue";
import { createPinia } from 'pinia';
import { setupApiClient } from "./api/apiClient";
import './assets/fonts/fonts.css'

interface UserProfile {
    id?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    roles?: string[];
}

interface UserData {
    profile: UserProfile | null;
}

const keycloak = keycloakInst;
const userData = reactive<UserData>({ profile: null });

function startApp() {
    const app = createApp(App);
    app.component('IconWrapper', IconWrapper);
    app.provide('keycloak', keycloak);
    app.provide('userData', userData);
    app.use(createPinia());
    app.use(router);
    setupRouterGuard(keycloak);
    app.mount('#app');
}

startApp();


keycloak.init({
    onLoad: 'check-sso',
    pkceMethod: 'S256',
    scope: 'openid offline_access'
}).then(async (authenticated: boolean) => {
    if (authenticated) {
        try {
            const profile = await keycloak.loadUserProfile();
            const roles = keycloak.tokenParsed?.realm_access?.roles || [];
            userData.profile = { ...profile, roles };
            setupApiClient(keycloak.idToken);

            setInterval(async () => {
                try {
                    const refreshed = await keycloak.updateToken(70);
                    if (refreshed) setupApiClient(keycloak.idToken);
                } catch {
                    keycloak.login();
                }
            }, 60000);

        } catch (error) {
            console.error('Failed to load user profile', error);
        }
    }
}).catch(error => {
    console.error('Keycloak initialization failed', error);
});