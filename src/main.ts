import { createApp, reactive } from 'vue';
import App from "./App.vue";
import keycloakInst from "./keycloakFactory";
import router from "./router";
import IconWrapper from "./components/helpers/IconWrapper.vue";
import './assets/tailwind.css';
import { createPinia } from 'pinia';
import { setupApiClient } from "./api/apiClient";

interface UserProfile {
    id?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
}

interface UserData {
    profile: UserProfile | null;
}

const keycloak = keycloakInst;
const userData = reactive<UserData>({ profile: null });

keycloak.init({
    onLoad: 'check-sso',
    pkceMethod: 'S256',
    scope: 'openid offline_access'
}).then(async (authenticated: boolean) => {
    console.log('authenticated: ', authenticated)
    if (authenticated) {
        try {
            const profile = await keycloak.loadUserProfile();
            userData.profile = profile;
            console.log('User profile loaded', profile);
            setupApiClient(keycloak.token);
            startApp();

            setInterval(async () => {
                try {
                    const refreshed = keycloak.updateToken(70);
                    if (refreshed) {
                        setupApiClient(keycloak.token);
                    } else {
                        console.log('Token is still valid');
                    }
                } catch (error) {
                    console.error('Failed to refresh token, logging out', error);
                    await keycloak.login({ prompt: 'login' });
                }
            }, 60000);

        } catch (error) {
            console.error('Failed to load user profile', error);
          //  keycloak.logout(); // Redirect to login on failure
        }
    } else {
        console.warn('Not authenticated - redirecting to login');
        await keycloak.login({ prompt: 'login' });
    }

}).catch(async (error: any) => {
    console.error('Failed to initialize Keycloak - redirecting to login', error);
    await keycloak.login({prompt: 'login'});
});

function startApp() {
    const app = createApp(App);
    app.component('IconWrapper', IconWrapper);
    app.provide('keycloak', keycloak);
    app.provide('userData', userData);
    app.use(createPinia());
    app.use(router);
    app.mount('#app');
}
