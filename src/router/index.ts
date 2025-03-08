import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import MainOutline from '../views/MainOutline.vue';
import Dashboard from '../views/DashboardView.vue';
import Brands from '../components/lists/kneo/Brands.vue';
import Queue from '../components/lists/kneo/SongsQueue.vue';
import SoundFragments from '../components/lists/kneo/SoundFragments.vue';
import SoundFragment from '../components/forms/kneo/SoundFragmentForm.vue';

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
                path: 'brands',
                name: 'Brands',
                component: Brands
            },
            {
                path: 'queue',
                name: 'TrackQueue',
                component: Queue
            },
            {
                path: 'soundfragments',
                name: 'SoundFragments',
                component: SoundFragments
            },
            {
                path: 'queue/new',
                name: 'NewSoundFragment',
                component: SoundFragment
            },
            {
                path: 'queue/:id',
                name: 'EditSoundFragment',
                component: SoundFragment
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