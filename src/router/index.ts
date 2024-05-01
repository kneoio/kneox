import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

import AboutView from '../views/AboutPage.vue';
import HomeView from "../views/HomeView.vue";
import DashboardView from "../views/DashboardView.vue";
import LicensePage from "../views/LicensePage.vue";


const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'Home',
        component: HomeView
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: DashboardView,
        meta: { requiresAuth: true }
    },
    {
        path: '/about',
        name: 'About',
        component: AboutView
    },
    { path: '/license', component: LicensePage },
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;