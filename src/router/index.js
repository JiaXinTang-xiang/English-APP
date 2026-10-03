import { createRouter, createWebHashHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import DailyView from '../views/DailyView.vue';
import SetupView from '../views/SetupView.vue';
import QuizView from '../views/QuizView.vue';
import WrongBookView from '../views/WrongBookView.vue';
import SummaryView from '../views/SummaryView.vue';
import AuthView from '../views/AuthView.vue';
import AccountView from '../views/AccountView.vue';
import WordsView from '../views/WordsView.vue';
import ArticlesView from '../views/ArticlesView.vue';
import StatisticsView from '../views/StatisticsView.vue';
import { identity, initializeIdentity } from '../services/identity';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/words', name: 'words', component: WordsView },
    { path: '/articles', name: 'articles', component: ArticlesView },
    { path: '/daily', name: 'daily', component: DailyView },
    { path: '/study/:day?', name: 'setup', component: SetupView },
    { path: '/quiz', name: 'quiz', component: QuizView },
    { path: '/wrong-book', name: 'wrongbook', component: WrongBookView },
    { path: '/summary', name: 'summary', component: SummaryView },
    { path: '/welcome', name: 'auth', component: AuthView, meta: { public: true, immersive: true } },
    { path: '/account', name: 'account', component: AccountView },
    { path: '/statistics', name: 'statistics', component: StatisticsView },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ],
  scrollBehavior: () => ({ top: 0 })
});

router.beforeEach(async to => {
  await initializeIdentity();
  if (to.meta.public) return true;
  if (identity.mode.value === 'unknown') return true;
  return true;
});

export default router;
