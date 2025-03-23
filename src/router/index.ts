import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import MainOutline from '../views/MainOutline.vue';
import Dashboard from '../views/DashboardView.vue';
import RadioStationQueue from '../components/lists/kneo/RadioStationQueue.vue';
import RadioStations from '../components/lists/kneo/RadioStations.vue';
import SoundFragments from '../components/lists/kneo/SoundFragments.vue';
import HlsStreamView from "../views/HlsStreamView.vue";

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        redirect: { name: 'Dashboard' }
    },
    {
        path: '/outline',
        component: MainOutline,
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
                path: '/player',
                name: 'HlsStreamTester',
                component: HlsStreamView
            }
        ]
    },
    {
        path: '/:catchAll(.*)*',
        redirect: { name: 'Dashboard' }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;