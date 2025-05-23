import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { inject } from 'vue';
import MainOutline from '../views/MainOutline.vue';
import Dashboard from '../views/DashboardView.vue';
import RadioStationQueue from '../components/lists/kneo/RadioStationQueue.vue';
import RadioStations from '../components/lists/kneo/RadioStations.vue';
import RadioStation from '../components/forms/kneo/RadioStationForm.vue';
import SoundFragments from '../components/lists/kneo/SoundFragments.vue';
import SoundFragment from '../components/forms/kneo/SoundFragmentForm.vue';
import HlsStreamView from "../views/HlsStreamView.vue";
import Keycloak from "keycloak-js";

declare module 'vue-router' {
    interface RouteMeta {
        requiresAuth?: boolean;
    }
}

const routes: Array<RouteRecordRaw> = [
    {
        path: '/welcome',
        name: 'WelcomeView',
        // Remove the WelcomeView component import and component property
        // since we're using static HTML now
        redirect: () => {
            window.location.href = '/welcome.html';
            return { name: 'WelcomeView' }; // This won't actually be reached
        },
        meta: { requiresAuth: false }
    },
    {
        path: '/outline',
        component: MainOutline,
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                redirect: { name: 'Dashboard' }
            },
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: Dashboard
            },
            {
                path: 'queues',
                name: 'RadioStationQueue',
                component: RadioStationQueue
            },
            {
                path: 'brands',
                name: 'Brands',
                component: RadioStations
            },
            {
                path: 'brands/:id',
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
                path: '/player',
                name: 'HlsStreamTester',
                component: HlsStreamView
            }
        ]
    },
    {
        path: '/:catchAll(.*)*',
        redirect: { name: 'WelcomeView' }
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