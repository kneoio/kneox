import {createRouter, createWebHistory, RouteRecordRaw} from 'vue-router';
import MainOutline from '../views/MainOutline.vue';
import DashboardView from '../views/DashboardView.vue';
import StationDashboard from '../components/forms/kneo/StationDashboard.vue';
import ChatForm from '../components/forms/kneo/ChatForm.vue';

import StationPlaylistView from '../components/lists/kneo/StationPlaylist.vue';
import Listeners from '../components/lists/kneo/Listeners.vue';
import AvailableListeners from '../components/lists/kneo/AvailableListeners.vue';
import AvailableScripts from '../components/lists/kneo/AvailableScripts.vue';
import ListenerForm from '../components/forms/kneo/ListenerForm.vue';
import RadioStations from '../components/lists/kneo/RadioStations.vue';
import RadioStation from '../components/forms/kneo/RadioStationForm.vue';
import SoundFragments from '../components/lists/kneo/SoundFragments.vue';
import SoundFragment from '../components/forms/kneo/SoundFragmentForm.vue';
import AiAgents from '../components/lists/kneo/AiAgents.vue';
import AiAgentForm from '../components/forms/kneo/AiAgentForm.vue';
import Scripts from '../components/lists/kneo/Scripts.vue';
import ScriptForm from '../components/forms/kneo/ScriptForm.vue';
import Prompts from '../components/lists/kneo/Prompts.vue';
import PromptForm from '../components/forms/kneo/PromptForm.vue';
import Drafts from '../components/lists/kneo/Drafts.vue';
import DraftForm from '../components/forms/kneo/DraftForm.vue';
import SceneForm from '../components/forms/kneo/SceneForm.vue';
import Scenes from '../components/lists/kneo/Scenes.vue';
import EnvironmentProfiles from '../components/lists/kneo/EnvironmentProfiles.vue';
import ProfileForm from '../components/forms/kneo/EnvironmentProfileForm.vue';
import Events from '../components/lists/kneo/Events.vue';
import EventForm from '../components/forms/kneo/EventForm.vue';
import Profile from '../components/lists/kneo/Profile.vue';
import Welcome from '../views/Welcome.vue';
import AboutM from '../views/AboutM.vue';
import SubmitSongM from '../views/SubmitSongM.vue';
import PostMessageM from '../views/PostMessageM.vue';
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
        component: Welcome,
    },
    {
        path: '/about',
        name: 'About',
        component: AboutM,
        meta: { requiresAuth: false }
    },
    {
        path: '/submit-song',
        name: 'SubmitSong',
        component: SubmitSongM,
        meta: { requiresAuth: false }
    },
    {
        path: '/post-message',
        name: 'PostMessage',
        component: PostMessageM,
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
                path: 'station/:brandName/scripts',
                name: 'StationScripts',
                component: AvailableScripts,
                props: true,
            },
            {
                path: 'station/:brandName/scripts/:id',
                name: 'StationScriptForm',
                component: ScriptForm,
                props: true,
            },
            {
                path: 'station/:brandName/chat',
                name: 'StationChat',
                component: ChatForm,
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
                path: 'scripts',
                name: 'Scripts',
                component: Scripts
            },
            {
                path: 'scenes',
                name: 'Scenes',
                component: Scenes
            },
            {
                path: 'scripts/:id',
                name: 'ScriptForm',
                component: ScriptForm,
                props: true
            },
            {
                path: 'scenes/:id',
                name: 'SceneForm',
                component: SceneForm,
                props: true
            },
            {
                path: 'prompts',
                name: 'Prompts',
                component: Prompts
            },
            {
                path: 'prompts/:id',
                name: 'PromptForm',
                component: PromptForm,
                props: true
            },
            {
                path: 'drafts',
                name: 'Drafts',
                component: Drafts
            },
            {
                path: 'drafts/:id',
                name: 'DraftForm',
                component: DraftForm,
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
            {
                path: 'profile',
                name: 'Profile',
                component: Profile
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
                        redirectUri: window.location.origin + '/outline'
                    });
                }

                if (keycloak.authenticated) {
                    try {
                        await keycloak.updateToken(30);
                        return true;
                    } catch (error) {
                        console.error('Token refresh failed:', error);
                        return keycloak.login({
                            redirectUri: window.location.origin + '/outline'
                        });
                    }
                }
                return keycloak.login({
                    redirectUri: window.location.origin + '/outline'
                });
            } catch (error) {
                console.error('Authentication failed:', error);
                return keycloak.login({
                    redirectUri: window.location.origin + '/outline'
                });
            }
        }
        return true;
    });
}

export default router;

