import {createApp, reactive} from 'vue';
import App from "./App.vue";
import keycloakInst from "./keycloakFactory";
import router from "./router";
import IconWrapper from "./components/IconWrapper.vue";
import './assets/tailwind.css';

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
        }).catch((error: any) => {
            console.error('Failed to load user profile', error);
            startApp();
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
    app.use(router);
    app.mount('#app');
}
