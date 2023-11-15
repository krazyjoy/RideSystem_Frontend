import { createWebHistory, createRouter } from 'vue-router'

import Home from "./components/Home.vue";
import Users from "./components/users.vue";
import Login from "./components/login.vue";
import Rides from "./components/rides.vue";
import Mqtt from './components/Mqtt_Connection.vue';
import Payment from './components/payment.vue';
import Trajectory from "./components/Trajectory.vue";
import Gmap from './components/Gmap.vue'
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
    },
    {
        path: '/mqtt',
        name: 'Mqtt',
        meta: {layout: 'mqtt-view'},
        component: Mqtt
    },
    {
        path: '/payment/:rid',
        name: 'Payment',
        meta: {layout: 'payment-view'},
        component: Payment
    },
    {
        path: '/map',
        name: 'Gmap',
        meta: {layout: 'gmap-view'},
        component: Gmap
    },
    {
        path: '/trajectory',
        name: 'Trajectory',
        meta: {layout: 'trajectory-view'},
        component: Trajectory,
        props: true

    }
]

const router = createRouter({
    history: createWebHistory(),
    routes, //same --- > routes:routes
})
export default router
