import {createRouter, createWebHistory, RouteRecordRaw} from 'vue-router';
import AboutView from '../views/AboutPage.vue';
import HomeView from '../views/HomeView.vue';
import DashboardView from '../views/DashboardView.vue';
import LicensePage from '../views/LicensePage.vue';
import ProjectsAndTasks from '../components/outlines/ProjectAndTasks.vue';
import ProjectsList from '../components/lists/ProjectsList.vue';
import ProjectForm from '../components/forms/ProjectForm.vue';
import AiAssistant from "../components/outlines/AiAssistant.vue";
import ChatAssistant from "../components/forms/ChatAssistant.vue";
import References from "../components/outlines/References.vue";
import OrganizationsList from "../components/lists/OrganizationsList.vue";
import EmployeeList from "../components/lists/EmployeeList.vue";
import EmployeeForm from "../components/forms/EmployeeForm.vue";
import OrganizationForm from "../components/forms/OrganizationForm.vue";
import PositionList from "../components/lists/PositionList.vue";
import LanguageList from "../components/lists/LanguageList.vue";
import LanguageForm from "../components/forms/LanguageForm.vue";
import LabelList from "../components/lists/LabelList.vue";
import LabelForm from "../components/forms/LabelForm.vue";
import OrgCategoryList from "../components/lists/OrgCategoryList.vue";
import OrgCategoryForm from "../components/forms/OrgCategoryForm.vue";
import TaskTypeList from "../components/lists/TaskTypeList.vue";
import TaskTypeForm from "../components/forms/TaskTypeForm.vue";
import PositionForm from "../components/forms/PositionForm.vue";
import TaskList from "../components/lists/TaskList.vue";
import TaskForm from "../components/forms/TaskForm.vue";

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
                path: 'projects-and-tasks',
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
                        children: [
                            {
                                path: 'by-author',
                                component: TaskList
                            },
                            {
                                path: 'by-author/:id',
                                name: 'TaskForm',
                                component: TaskForm
                            },
                            {
                                path: 'by-project',
                                component: TaskList
                            },
                            {
                                path: 'by-project/:id',
                                name: 'TaskForm',
                                component: TaskForm
                            },
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
                        path: 'organizations/new',
                        name: 'NewOrganizationForm',
                        component: OrganizationForm
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
                        children: [
                            {
                                path: 'languages',
                                component: LanguageList
                            },
                            {
                                path: 'languages/:id',
                                name: 'LanguageForm',
                                component: LanguageForm
                            },
                            {
                                path: 'labels',
                                component: LabelList
                            },
                            {
                                path: 'labels/:id',
                                name: 'LabelForm',
                                component: LabelForm
                            },
                            {
                                path: 'org-category',
                                component: OrgCategoryList
                            },
                            {
                                path: 'org-category/:id',
                                name: 'OrgCategoryForm',
                                component: OrgCategoryForm
                            },
                            {
                                path: 'positions',
                                component: PositionList
                            },
                            {
                                path: 'positions/:id',
                                name: 'PositionForm',
                                component: PositionForm
                            },
                            {
                                path: 'task-types',
                                component: TaskTypeList
                            },
                            {
                                path: 'task-types/:id',
                                name: 'TaskTypeForm',
                                component: TaskTypeForm
                            }
                        ]
                    }
                ]
            },
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
                redirect: '/projects-and-tasks/projects'
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
