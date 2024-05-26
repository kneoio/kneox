import {createApp, reactive} from 'vue';
import App from "./App.vue";
import keycloakInst from "./keycloakFactory";
import router from "./router";
import IconWrapper from "./components/IconWrapper.vue";
import './assets/tailwind.css';
import {createPinia} from 'pinia';

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
}).then((authenticated: boolean) => {
    if (authenticated) {
        console.log('User authenticated');
        keycloak.loadUserProfile().then((profile: any) => {
            userData.profile = profile;
            console.log('User profile loaded', profile);
            startApp();
            cleanUpUrl();
        }).catch((error: any) => {
            console.error('Failed to load user profile', error);
            startApp();
            cleanUpUrl();
        });
    } else {
        console.warn('Authentication failed - proceeding without authentication');
        startApp();
    }
}).catch((error: any) => {
    console.error('Failed to initialize Keycloak - proceeding without authentication', error);
    startApp();
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

function cleanUpUrl() {
    router.replace(window.location.pathname); // Remove query parameters from the URL
}
