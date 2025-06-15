import {createRouter, createWebHistory, RouteRecordRaw} from 'vue-router';
import {inject} from 'vue';
import MainOutline from '../views/MainOutline.vue';
import DashboardView from '../views/DashboardView.vue';
import StationDetailView from '../views/StationDetailView.vue';
import RadioStations from '../components/lists/kneo/RadioStations.vue';
import RadioStation from '../components/forms/kneo/RadioStationForm.vue';
import SoundFragments from '../components/lists/kneo/SoundFragments.vue';
import SoundFragment from '../components/forms/kneo/SoundFragmentForm.vue';
import Memories from '../components/lists/kneo/Memories.vue';
import MemoryForm from '../components/forms/kneo/MemoryForm.vue';
import AiAgents from '../components/lists/kneo/AiAgents.vue';
import AiAgentForm from '../components/forms/kneo/AiAgentForm.vue';
import Profiles from '../components/lists/kneo/Profiles.vue';
import ProfileForm from '../components/forms/kneo/ProfileForm.vue';
import Player from "../views/HlsStreamView.vue";
import Keycloak from "keycloak-js";
import apiClient from "../api/apiClient";

declare module 'vue-router' {
    interface RouteMeta {
        requiresAuth?: boolean;
    }
}

const routes: Array<RouteRecordRaw> = [
    {
        path: '/welcome',
        name: 'WelcomeView',
        redirect: () => {
            window.location.href = '/welcome.html';
            return {name: 'WelcomeView'};
        },
        meta: {requiresAuth: false}
    },
    {
        path: '/outline',
        component: MainOutline,
        meta: {requiresAuth: true},
        children: [
            {
                path: '',
                redirect: {name: 'Dashboard'}
            },
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: DashboardView,
                meta: {requiresAuth: true, titleKey: 'Dashboard'}
            },
            {
                path: 'station/:brandName',
                name: 'StationDetail',
                component: StationDetailView,
                props: true,
                meta: {requiresAuth: true, titleKey: 'Station Details'},
            },
            {
                path: 'radiostations',
                name: 'RadioStations',
                component: RadioStations
            },
            {
                path: 'radiostations/:id',
                name: 'RadioStation',
                component: RadioStation
            },
            {
                path: 'soundfragments',
                name: 'SoundFragments',
                component: SoundFragments
            },
            {
                path: 'soundfragments/:id',
                name: 'SoundFragment',
                component: SoundFragment,
                props: true
            },
            {
                path: 'memories',
                name: 'Memories',
                component: Memories
            },
            {
                path: 'memories/:id',
                name: 'MemoryForm',
                component: MemoryForm,
                props: true
            },
            {
                path: 'ai_agents',
                name: 'AiAgents',
                component: AiAgents
            },
            {
                path: 'ai_agents/:id',
                name: 'AiAgentForm',
                component: AiAgentForm,
                props: true
            },
            {
                path: 'profiles',
                name: 'Profiles',
                component: Profiles
            },
            {
                path: 'profiles/:id',
                name: 'ProfileForm',
                component: ProfileForm,
                props: true
            },
            {
                path: '/player',
                name: 'Player',
                component: Player
            }
        ]
    },
    {
        path: '/api/soundfragments/files/:uuid/:name',
        component: { render: () => null },
        beforeEnter: async (to) => {
            try {
                const response = await apiClient.get(to.fullPath, {
                    responseType: 'blob'
                });
                const url = URL.createObjectURL(response.data);
                const a = document.createElement('a');
                a.href = url;
                a.download = to.params.name as string;
                document.body.appendChild(a); // Required for Firefox
                a.click();

                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 1000);

                return false;

            } catch (error) {
                console.error('Download failed:', error);
                return { name: 'WelcomeView' };
            }
        }
    },
    {
        path: '/:catchAll(.*)*',
        redirect: {name: 'WelcomeView'}
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export function setupRouterGuard() {
    const keycloak = inject<Keycloak>('keycloak');

    if (!keycloak) {
        throw new Error('Keycloak instance not provided');
    }

    router.beforeEach(async (to) => {
        // Skip auth check for welcome page
        if (to.name === 'WelcomeView') {
            return true;
        }

        if (to.matched.some(record => record.meta.requiresAuth)) {
            try {
                if (!keycloak.authenticated) {
                    await keycloak.init({
                        onLoad: 'login-required',
                        checkLoginIframe: false
                    });
                }

                if (keycloak.authenticated) {
                    try {
                        await keycloak.updateToken(30);
                        return true;
                    } catch (error) {
                        console.error('Token refresh failed:', error);
                        return keycloak.login({
                            redirectUri: window.location.origin + to.path
                        });
                    }
                }
                return keycloak.login({
                    redirectUri: window.location.origin + to.path
                });
            } catch (error) {
                console.error('Authentication failed:', error);
                return keycloak.login({
                    redirectUri: window.location.origin + to.path
                });
            }
        }
        return true;
    });
}

export default router;