import {createRouter, createWebHistory, RouteRecordRaw} from 'vue-router';
import AboutView from '../views/AboutPage.vue';
import HomeView from '../views/HomeView.vue';
import DashboardView from '../views/DashboardView.vue';
import LicensePage from '../views/LicensePage.vue';
import ProjectsAndTasks from '../components/outlines/ProjectAndTasks.vue';
import ProjectsList from '../components/lists/ProjectsList.vue';
import ProjectForm from '../components/forms/ProjectForm.vue';
import AiAssistant from "../components/outlines/AiAssistant.vue";
import ChatAssistant from "../components/forms/Chat.vue";
import References from "../components/outlines/References.vue";
import OrganizationsList from "../components/lists/OrganizationsList.vue";
import EmployeeList from "../components/lists/EmployeeList.vue";
import EmployeeForm from "../components/forms/EmployeeForm.vue";
import OrganizationForm from "../components/forms/OrganizationForm.vue";

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        redirect: '/dashboard'
    },
    {
        path: '/',
        component: HomeView,
        children: [
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: DashboardView,
                meta: {requiresAuth: true}
            },
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
                        name: 'ProjectForm',
                        component: ProjectForm
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
                path: 'references',
                component: References,
                children: [
                    {
                        path: 'organizations',
                        component: OrganizationsList
                    },
                    {
                        path: 'organizations/:id',
                        name: 'OrganizationForm',
                        component: OrganizationForm
                    },
                    {
                        path: 'employees',
                        component: EmployeeList
                    },
                    {
                        path: 'employees/:id',
                        name: 'EmployeeForm',
                        component: EmployeeForm
                    },
                    {
                        path: 'lookups',
                        component: EmployeeList
                    }
                ]},
            {
                path: 'ai',
                component: AiAssistant,
                children: [
                    {
                        path: 'chat',
                        component: ChatAssistant
                    }
                ]
            },
            {
                path: 'projects',
                redirect: '/projects_and_tasks/projects'
            },
            {
                path: 'references',
                redirect: '/references/organizations'
            },
            {
                path: 'ai',
                redirect: '/ai/chat'
            }
        ]
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
