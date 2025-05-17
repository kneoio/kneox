import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { inject } from 'vue';
import type { KeycloakInstance } from 'keycloak-js';
import MainOutline from '../views/MainOutline.vue';
import Dashboard from '../views/DashboardView.vue';
import RadioStationQueue from '../components/lists/kneo/RadioStationQueue.vue';
import RadioStations from '../components/lists/kneo/RadioStations.vue';
import SoundFragments from '../components/lists/kneo/SoundFragments.vue';
import SoundFragment from '../components/forms/kneo/SoundFragmentForm.vue';
import HlsStreamView from "../views/HlsStreamView.vue";
import WelcomeView from "../views/WelcomeView.vue";

declare module 'vue-router' {
    interface RouteMeta {
        requiresAuth?: boolean;
    }
}

const routes: Array<RouteRecordRaw> = [
    {
        path: '/welcome',
        name: 'WelcomeView',
        component: WelcomeView,
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
                path: 'soundfragments',
                name: 'SoundFragments',
                component: SoundFragments
            },
            {
                path: 'soundfragment',
                name: 'SoundFragment',
                component: SoundFragment
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
    const keycloak = inject<KeycloakInstance>('keycloak');

    if (!keycloak) {
        throw new Error('Keycloak instance not provided');
    }

    router.beforeEach(async (to) => {
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