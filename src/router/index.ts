import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

import AboutView from '../views/AboutView.vue';
import HomeView from "../views/HomeView.vue";
import DashboardView from "../views/DashboardView.vue";


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
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;