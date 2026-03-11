<script setup>
import { ref, inject, onMounted, onUnmounted } from 'vue'

const isDark = inject('isDark')
const toggleDark = inject('toggleDark')

// Mobile menu state
const menuOpen = ref(false)

// Active section tracking
const activeSection = ref('home')

// Navigation links
const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Skills', href: '#skills' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact', href: '#contact' },
]

// Scroll to section helper
function scrollTo(href) {
  menuOpen.value = false
  const el = document.querySelector(href)
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 72
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

// Track active section on scroll
function onScroll() {
  const sections = ['home', 'about', 'skills', 'projects', 'contact']
  for (const id of sections.reverse()) {
    const el = document.getElementById(id)
    if (el && window.scrollY >= el.offsetTop - 120) {
      activeSection.value = id
      break
    }
  }
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <nav
    class="fixed top-0 left-0 right-0 z-50 glass shadow-sm"
    role="navigation"
    aria-label="Main navigation"
  >
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">

        <!-- Logo / Name -->
        <button
          @click="scrollTo('#home')"
          class="font-bold text-xl gradient-text focus:outline-none"
          aria-label="Go to top"
        >
          Rabin Regmi
        </button>

        <!-- Desktop nav links -->
        <ul class="hidden md:flex items-center gap-1" role="list">
          <li v-for="link in navLinks" :key="link.href">
            <button
              @click="scrollTo(link.href)"
              :class="[
                'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500',
                activeSection === link.href.slice(1)
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30',
              ]"
              :aria-current="activeSection === link.href.slice(1) ? 'page' : undefined"
            >
              {{ link.label }}
            </button>
          </li>
        </ul>

        <!-- Right side: theme toggle + hamburger -->
        <div class="flex items-center gap-2">
          <!-- Dark / Light mode toggle -->
          <button
            @click="toggleDark()"
            class="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <!-- Sun icon (light mode) -->
            <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M18.364 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <!-- Moon icon (dark mode) -->
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>

          <!-- Hamburger (mobile only) -->
          <button
            @click="menuOpen = !menuOpen"
            class="md:hidden p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            :aria-expanded="menuOpen"
            aria-controls="mobile-menu"
            aria-label="Toggle mobile menu"
          >
            <!-- Hamburger / X icon -->
            <svg v-if="!menuOpen" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg v-else class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile menu -->
    <div
      v-if="menuOpen"
      id="mobile-menu"
      class="md:hidden border-t border-white/20 dark:border-slate-700/50"
    >
      <ul class="px-4 py-3 space-y-1" role="list">
        <li v-for="link in navLinks" :key="link.href">
          <button
            @click="scrollTo(link.href)"
            :class="[
              'w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
              activeSection === link.href.slice(1)
                ? 'bg-indigo-500 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-500',
            ]"
          >
            {{ link.label }}
          </button>
        </li>
      </ul>
    </div>
  </nav>
</template>
