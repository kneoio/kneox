import { createApp, reactive } from 'vue';
import App from "./App.vue";
import keycloakInst from "./keycloakFactory";
import router, { setupRouterGuard } from "./router";
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
    console.log('Initial authentication status: ', authenticated);
    if (authenticated) {
        try {
            const profile = await keycloak.loadUserProfile();
            userData.profile = profile;
            console.log('User profile loaded', profile);
            setupApiClient(keycloak.idToken); // Setup API client with token

            // Token refresh interval
            setInterval(async () => {
                try {
                    const refreshed = await keycloak.updateToken(70);
                    if (refreshed) {
                        console.log('Token was successfully refreshed');
                        setupApiClient(keycloak.idToken); // Re-setup API client with new token
                    } else {
                        console.log('Token is still valid');
                    }
                } catch (error) {
                    console.error('Failed to refresh token, attempting login', error);
                    keycloak.login(); // Force login on refresh failure
                }
            }, 60000); // Check every 60 seconds

        } catch (error) {
            console.error('Failed to load user profile or setup API client post-authentication', error);
            // Decide if app should start or show an error page
        }
    } else {
        console.log('User is not authenticated initially.');
        // API client might be set up without a token for public endpoints, or not at all
        // setupApiClient(); // Or setupApiClient(null) if it supports unauthenticated state
    }
    // Always start the app to allow access to public routes
    startApp();

}).catch(error => {
    console.error('Keycloak initialization failed catastrophically', error);
    // Potentially start app with an error message or limited functionality
    // For example, you could navigate to an error page or show a global notification
    startApp(); // Attempt to start the app to show public content or an error state
});

function startApp() {
    const app = createApp(App);
    app.component('IconWrapper', IconWrapper);
    app.provide('keycloak', keycloak);
    app.provide('userData', userData);
    app.use(createPinia());
    app.use(router);
    setupRouterGuard(keycloak); // Initialize router guards and pass keycloak instance
    app.mount('#app');
}