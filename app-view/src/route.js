import { createWebHistory, createRouter } from 'vue-router'

import Home from "./components/Home.vue";
import Users from "./components/users.vue";
import Login from "./components/login.vue";
import Rides from "./components/rides.vue";

export const routes = [
    {
        path: '/',
        name: 'home-view',
        meta: {layout: 'home-view'},
        component: Home
    },
    {
        path: '/login',
        name: 'Login',
        meta: {layout: 'login-view'},
        component: Login
    },
    {
        path: '/users',
        name: 'Users',
        meta: {layout: 'users-view'},
        component: Users
    },
    {
        path: '/rides',
        name: 'Rides',
        meta: {layout: 'rides-view'},
        component: Rides
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes, //same --- > routes:routes
})
export default router
