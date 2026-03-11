<script setup>
import { onMounted } from 'vue'

// Quick stats shown below bio
const stats = [
  { icon: '📍', label: 'Monroe, LA' },
  { icon: '🎓', label: 'GPA: 3.67' },
  { icon: '💼', label: 'Open to Work' },
  { icon: '🎯', label: 'May 2026 Grad' },
]

// Intersection Observer — fade-in-up on scroll
onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.15 }
  )

  document.querySelectorAll('#about .reveal').forEach((el) => observer.observe(el))
})
</script>

<template>
  <section
    id="about"
    class="section-padding bg-slate-50 dark:bg-slate-900"
    aria-labelledby="about-heading"
  >
    <div class="max-w-6xl mx-auto">

      <!-- Section header -->
      <div class="text-center mb-16 reveal">
        <p class="font-mono text-indigo-500 dark:text-indigo-400 text-sm uppercase tracking-widest mb-2">Get to know me</p>
        <h2 id="about-heading" class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          About <span class="gradient-text">Me</span>
        </h2>
      </div>

      <!-- Two-column layout -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        <!-- Left: Profile photo -->
        <div class="flex justify-center reveal">
          <div class="relative">
            <!-- Gradient ring border -->
            <div
              class="w-64 h-64 sm:w-72 sm:h-72 rounded-full p-1 bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 shadow-2xl"
              style="animation: pulse-glow 3s ease-in-out infinite"
            >
              <img
                src="@/assets/profile.jpg"
                alt="Rabin Regmi"
                class="w-full h-full object-cover rounded-full"
              />
            </div>

            <!-- Floating badge - location -->
            <div class="absolute -bottom-4 -right-4 bg-white dark:bg-slate-800 rounded-2xl px-4 py-2 shadow-xl border border-slate-100 dark:border-slate-700 flex items-center gap-2">
              <span class="text-lg" aria-hidden="true">📍</span>
              <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">Monroe, LA</span>
            </div>
          </div>
        </div>

        <!-- Right: Bio + stats -->
        <div class="space-y-6 reveal" style="animation-delay:0.2s">
          <div>
            <h3 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Hi! I'm Rabin 👋
            </h3>
            <div class="space-y-3 text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                I'm a <strong class="text-indigo-500 dark:text-indigo-400">Computer Science student</strong> at the
                University of Louisiana at Monroe (GPA 3.67/4.0), graduating in <strong class="text-indigo-500 dark:text-indigo-400">May 2026</strong>.
              </p>
              <p>
                I'm passionate about building software that solves real problems — from full-stack web applications
                to machine learning projects. I love learning new technologies and turning ideas into working products.
              </p>
              <p>
                Currently exploring <span class="font-mono text-cyan-500">ML & AI</span> with PyTorch, building
                full-stack apps with Vue.js & Node.js, and working as a Technical Assistant at ULM's Library Help Desk.
              </p>
            </div>
          </div>

          <!-- Quick stats grid -->
          <div class="grid grid-cols-2 gap-3 pt-2">
            <div
              v-for="(stat, i) in stats"
              :key="stat.label"
              class="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors duration-200"
            >
              <span class="text-2xl" aria-hidden="true">{{ stat.icon }}</span>
              <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ stat.label }}</span>
            </div>
          </div>

          <!-- CTA -->
          <div class="flex gap-3 pt-2">
            <a
              href="https://www.linkedin.com/in/rabin-regmi-63785b256"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-primary text-sm"
              aria-label="Connect on LinkedIn"
            >
              Connect on LinkedIn
            </a>
            <a
              href="https://github.com/rabinregmi188"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-secondary text-sm"
              aria-label="View GitHub profile"
            >
              GitHub Profile
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>