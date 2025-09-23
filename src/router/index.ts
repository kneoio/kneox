import {createRouter, createWebHistory, RouteRecordRaw} from 'vue-router';
import MainOutline from '../views/MainOutline.vue';
import DashboardView from '../views/DashboardView.vue';
import StationDashboard from '../components/forms/kneo/StationDashboard.vue';

import StationPlaylistView from '../components/lists/kneo/StationPlaylist.vue';
import Listeners from '../components/lists/kneo/Listeners.vue';
import AvailableListeners from '../components/lists/kneo/AvailableListeners.vue';
import ListenerForm from '../components/forms/kneo/ListenerForm.vue';
import RadioStations from '../components/lists/kneo/RadioStations.vue';
import RadioStation from '../components/forms/kneo/RadioStationForm.vue';
import SoundFragments from '../components/lists/kneo/SoundFragments.vue';
import SoundFragment from '../components/forms/kneo/SoundFragmentForm.vue';
import Memories from '../components/lists/kneo/Memories.vue';
import MemoryForm from '../components/forms/kneo/MemoryForm.vue';
import AiAgents from '../components/lists/kneo/AiAgents.vue';
import AiAgentForm from '../components/forms/kneo/AiAgentForm.vue';
import EnvironmentProfiles from '../components/lists/kneo/EnvironmentProfiles.vue';
import ProfileForm from '../components/forms/kneo/EnvironmentProfileForm.vue';
import Events from '../components/lists/kneo/Events.vue';
import EventForm from '../components/forms/kneo/EventForm.vue';
import WelcomeView from '../views/WelcomeView.vue';
import About from '../views/About.vue';
import SubmitSongView from '../views/SubmitSongView.vue';
import PostMessageView from '../views/PostMessageView.vue';
// Player is served directly from public/player
import Keycloak from "keycloak-js";
import apiClient from "../api/apiClient";

declare module 'vue-router' {
    interface RouteMeta {
        requiresAuth?: boolean;
    }
}

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'Welcome',
        component: WelcomeView,
    },
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
        path: '/mixpla',
        name: 'Mixpla',
        component: WelcomeView,
        meta: {requiresAuth: false}
    },
    {
        path: '/about',
        name: 'PublicAbout',
        component: About,
        meta: { requiresAuth: false }
    },
    {
        path: '/submit-song',
        name: 'SubmitSong',
        component: SubmitSongView,
        meta: { requiresAuth: false }
    },
    {
        path: '/post-message',
        name: 'PostMessage',
        component: PostMessageView,
        meta: { requiresAuth: false }
    },
    {
        path: '/outline',
        component: MainOutline,
        meta: {requiresAuth: true},
        children: [
            {
                path: '',
                redirect: {name: 'RadioStations'}
            },
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: DashboardView,
                meta: {requiresAuth: true, titleKey: 'Dashboard'}
            },
            {
                path: 'station/:brandName',
                name: 'StationDashboard',
                component: StationDashboard,
                props: true,
                meta: {requiresAuth: true, titleKey: 'Station Details'},
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
                name: 'EditListener',
                component: ListenerForm,
                props: true,
            },
            {
                path: 'station/:brandName/soundfragments',
                name: 'StationSoundFragments',
                component: SoundFragments,
                props: true,
            },
            {
                path: 'station/:brandName/soundfragments/:id',
                name: 'EditSoundFragment',
                component: SoundFragment,
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
                name: 'EnvironmentProfiles',
                component: EnvironmentProfiles
            },
            {
                path: 'profiles/:id',
                name: 'ProfileForm',
                component: ProfileForm,
                props: true
            },
            {
                path: 'events',
                name: 'Events',
                component: Events
            },
            {
                path: 'events/:id',
                name: 'EventForm',
                component: EventForm,
                props: true
            },
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

export function setupRouterGuard(keycloak: Keycloak) {
    if (!keycloak) {
        throw new Error('Keycloak instance was not provided to setupRouterGuard');
    }

    router.beforeEach(async (to) => {
        if (to.name === 'WelcomeView') {
            return true;
        }

        if (to.matched.some(record => record.meta.requiresAuth)) {
            try {
                if (!keycloak.authenticated) {
                    return keycloak.login({
                        redirectUri: window.location.origin + to.fullPath 
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