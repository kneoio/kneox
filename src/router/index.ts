import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

import MainOutline from '../views/MainOutline.vue';
import Dashboard from '../views/DashboardView.vue';
import Tasks from '../components/lists/project/TaskListByAuthor.vue';
import Queue from '../components/lists/kneo/SongsQueue.vue';
import TaskForm from '../components/forms/project/TaskForm.vue';
import SoundFragment from '../components/forms/kneo/SoundFragmentForm.vue';

const routes: Array<RouteRecordRaw> = [
    {
        path: '/:catchAll(.*)*',
        redirect: '/outline/dashboard' // Redirect to the outline's dashboard as a fallback
    },
    {
        path: '/outline',
        component: MainOutline,
        children: [
            {
                path: '',
                redirect: '/outline/dashboard' // Default to /outline/dashboard
            },
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: Dashboard
            },
            {
                path: 'queue',
                name: 'Track Queue',
                component: Queue
            },
            {
                path: 'tasks',
                name: 'Tasks',
                component: Tasks
            },
            {
                path: 'queue/new',
                name: 'NewSoundFragment',
                component: SoundFragment
            },
            {
                path: 'tasks/new',
                name: 'NewTaskForm',
                component: TaskForm
            },
            {
                path: 'tasks/:id', // Route for editing an existing task
                name: 'EditTaskForm',
                component: TaskForm
            }
        ]
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;
