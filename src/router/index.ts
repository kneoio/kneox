import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import MainOutline from '../views/MainOutline.vue';
import DashboardView from '../views/DashboardView.vue';
import StationDashboard from '../components/forms/kneo/StationDashboard.vue';
import ChatForm from '../components/forms/kneo/ChatForm.vue';

import StationPlaylistView from '../components/lists/kneo/StationPlaylist.vue';
import Listeners from '../components/lists/kneo/Listeners.vue';
import AvailableListeners from '../components/lists/kneo/AvailableListeners.vue';
import ListenerForm from '../components/forms/kneo/ListenerForm.vue';
import Brands from '../components/lists/kneo/Brands.vue';
import BrandForm from '../components/forms/kneo/BrandForm.vue';
import Profile from '../components/lists/kneo/Profile.vue';
import Welcome from '../views/Welcome.vue';
import AboutM from '../views/AboutM.vue';
import StationPage from '../views/StationPage.vue';
import Keycloak from "keycloak-js";
import { keycloakReadyPromise } from '../main';

declare module 'vue-router' {
    interface RouteMeta {
        requiresAuth?: boolean;
    }
}

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'Welcome',
        component: Welcome,
    },
    {
        path: '/about',
        name: 'About',
        component: AboutM,
        meta: { requiresAuth: false }
    },
    {
        path: '/:brand',
        name: 'StationPage',
        component: StationPage,
        meta: { requiresAuth: false }
    },
    {
        path: '/outline',
        component: MainOutline,
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                redirect: { name: 'Brands' }
            },
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: DashboardView,
                meta: { requiresAuth: true, titleKey: 'Dashboard' }
            },
            {
                path: 'station/:brandName',
                name: 'StationDashboard',
                component: StationDashboard,
                props: true,
                meta: { requiresAuth: true, titleKey: 'Station Details' },
            },
            {
                path: 'station/:brandName/playlist',
                name: 'StationPlaylist',
                component: StationPlaylistView,
                props: true,
            },
            {
                path: 'station/:brandName/listeners',
                name: 'StationListeners',
                component: AvailableListeners,
                props: true,
            },
            {
                path: 'station/:brandName/listeners/:id',
                name: 'EditBrandListener',
                component: () => import( '../components/forms/kneo/BrandListenerForm.vue' ),
                props: true,
            },
            {
                path: 'station/:brandName/chat',
                name: 'StationChat',
                component: ChatForm,
                props: true,
            },
            {
                path: 'listeners',
                name: 'Listeners',
                component: Listeners
            },
            {
                path: 'listeners/:id',
                name: 'Listener',
                component: ListenerForm,
                props: true
            },
            {
                path: 'brands',
                name: 'Brands',
                component: Brands
            },
            {
                path: 'brands/:id',
                name: 'Brand',
                component: BrandForm
            },
            {
                path: 'profile',
                name: 'Profile',
                component: Profile
            },
        ]
    },
    {
        path: '/:catchAll(.*)*',
        redirect: { name: 'WelcomeView' }
    }
];

const router = createRouter( {
    history: createWebHistory(),
    routes
} );


export function setupRouterGuard( keycloak: Keycloak ) {
    if ( !keycloak ) {
        throw new Error( 'Keycloak instance was not provided to setupRouterGuard' );
    }


    router.beforeEach( async ( to ) => {
        if ( to.matched.some( record => record.meta.requiresAuth ) ) {
            await keycloakReadyPromise; // wait, don't just skip
            if ( !keycloak.authenticated ) {
                return keycloak.login( { redirectUri: window.location.origin + '/outline' } );
            }
            try {
                await keycloak.updateToken( 30 );
                return true;
            } catch {
                return keycloak.login( { redirectUri: window.location.origin + '/outline' } );
            }
        }
        return true; // public routes pass instantly
    } );
}

export default router;
