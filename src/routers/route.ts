import { RouteRecordRaw } from 'vue-router';
const routes: RouteRecordRaw[] = [
  {
    path : '/',
    name : 'home',
    component : () => import("@/views/vr-room1/index.vue")
  },
  {
    path : '/vr2',
    name : 'vr2',
    component : () => import('@/views/vr-room2/index.vue')
  }
]
export default routes;