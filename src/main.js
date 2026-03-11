import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

// Vue Router - single page, sections used for hash-based scroll
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
  ],
  scrollBehavior(to) {
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
        top: 72, // navbar height offset
      }
    }
    return { top: 0 }
  },
})

// Apply dark mode from localStorage on initial load
const savedTheme = localStorage.getItem('theme')
if (savedTheme === 'light') {
  document.documentElement.classList.remove('dark')
} else {
  // Default to dark mode
  document.documentElement.classList.add('dark')
}

createApp(App).use(router).mount('#app')
