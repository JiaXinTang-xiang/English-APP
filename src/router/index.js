import { createRouter, createWebHashHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import DailyView from '../views/DailyView.vue';
import SetupView from '../views/SetupView.vue';
import QuizView from '../views/QuizView.vue';
import WrongBookView from '../views/WrongBookView.vue';
import SummaryView from '../views/SummaryView.vue';
import AuthView from '../views/AuthView.vue';

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/daily', name: 'daily', component: DailyView },
    { path: '/study/:day?', name: 'setup', component: SetupView },
    { path: '/quiz', name: 'quiz', component: QuizView },
    { path: '/wrong-book', name: 'wrongbook', component: WrongBookView },
    { path: '/summary', name: 'summary', component: SummaryView },
    { path: '/auth', name: 'auth', component: AuthView },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ],
  scrollBehavior: () => ({ top: 0 })
});
