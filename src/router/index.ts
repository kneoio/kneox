import {createRouter, createWebHistory, RouteRecordRaw} from 'vue-router';

import AboutView from '../views/AboutPage.vue';
import HomeView from "../views/HomeView.vue";
import DashboardView from "../views/DashboardView.vue";
import LicensePage from "../views/LicensePage.vue";
import KneoMoneyOutline from "../components/KneoMoneyOutline.vue";
import KneoAIAssistantOutline from "../components/KneoAIAssitantOutline.vue";
import KneoProjectsOutline from "../components/KneoProjectsOutline.vue";
import KneoKickNeo from "../components/KneoKickNeo.vue";
import KneoChatGPT from "../components/KneoChatGPT.vue";


const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'Home',
        component: HomeView,
        children: [
            {
                path: 'projects',
                component: KneoProjectsOutline
            },
            {
                path: 'money',
                component: KneoMoneyOutline
            },
            {
                path: 'ai',
                component: KneoAIAssistantOutline,
                children: [
                    {
                        path: 'kickneo',
                        component: KneoKickNeo
                    },
                    {
                        path: 'gpt',
                        component: KneoChatGPT
                    }

                ]
            }
        ]
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: DashboardView,
        meta: {requiresAuth: true}
    },
    {
        path: '/about',
        name: 'About',
        component: AboutView
    },
    {path: '/license', component: LicensePage}
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;