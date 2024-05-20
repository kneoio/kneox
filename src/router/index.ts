import {createRouter, createWebHistory, RouteRecordRaw} from 'vue-router';
import AboutView from '../views/AboutPage.vue';
import HomeView from '../views/HomeView.vue';
import DashboardView from '../views/DashboardView.vue';
import LicensePage from '../views/LicensePage.vue';
import ProjectsAndTasks from '../components/lists/ProjectAndTasks.vue';
import ProjectsList from '../components/lists/ProjectsList.vue';
import KneoProjectForm from '../components/forms/KneoProjectForm.vue';

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'Home',
        component: HomeView,
        children: [
            {
                path: 'projects_and_tasks',
                component: ProjectsAndTasks,
                children: [
                    {
                        path: 'projects',
                        component: ProjectsList
                    },
                    {
                        path: 'projects/:id',
                        name: 'KneoProjectForm',
                        component: KneoProjectForm
                    },
                    {
                        path: 'tasks',
                        component: ProjectsList,
                        children: [
                            {
                                path: 'by-author',
                                component: ProjectsList
                            },
                            {
                                path: 'by-project',
                                component: ProjectsList
                            }
                        ]
                    }
                ]
            },
            {
                path: 'money',
                component: ProjectsList
            },
            {
                path: 'ai',
                component: ProjectsList,
                children: [
                    {
                        path: 'kickneo',
                        component: ProjectsList
                    },
                    {
                        path: 'gpt',
                        component: ProjectsList
                    }
                ]
            },
            {
                path: '/projects',
                redirect: '/projects_and_tasks/projects'  // Redirect /projects to /projects_and_tasks/projects
            }
        ]
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
    {
        path: '/license',
        component: LicensePage
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;
