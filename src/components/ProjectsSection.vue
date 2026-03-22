<script setup>
import { onMounted } from 'vue'

const projects = [
  {
    id: 1,
    emoji: '🎓',
    name: '5PANDAVA (Drona)',
    description:
      'AI-powered academic code grading platform with plagiarism detection, automated scoring via Gemini API, and AI-generated code detection. Built for educators who need scalable, intelligent assessment tools.',
    tags: ['Next.js', 'FastAPI', 'Python', 'PostgreSQL', 'Redis', 'Docker'],
    gradient: 'from-indigo-500 to-violet-600',
    githubUrl: 'https://github.com/dineshchhantyal/5PANDAVA',
    demoUrl: null,
    comingSoon: false,
  },
  {
    id: 2,
    emoji: '🌐',
    name: 'Portfolio Website',
    description:
      'This site! Personal portfolio with dark mode, smooth scroll animations, a typewriter effect, and a fully responsive layout. Built from scratch with Vue.js 3 and Tailwind CSS.',
    tags: ['Vue.js 3', 'Tailwind CSS', 'Vite', 'JavaScript'],
    gradient: 'from-cyan-500 to-indigo-500',
    githubUrl: 'https://github.com/rabinregmi188/rabin-portfolio',
    demoUrl: null,
    comingSoon: false,
  },
  {
    id: 3,
    emoji: '📝',
    name: 'SmartNotes',
    description:
      'Full-stack note-taking app with tags, full-text search, and secure JWT authentication. Organize your thoughts with a clean, intuitive interface.',
    tags: ['Node.js', 'Express', 'Vue.js', 'PostgreSQL'],
    gradient: 'from-violet-500 to-pink-500',
    githubUrl: null,
    demoUrl: null,
    comingSoon: true,
  },
  {
    id: 4,
    emoji: '📚',
    name: 'StudyTracker',
    description:
      'Track your study hours and visualize progress with beautiful interactive charts. Set goals, monitor streaks, and stay on top of your learning journey.',
    tags: ['Vue.js', 'Chart.js', 'Firebase'],
    gradient: 'from-green-500 to-teal-500',
    githubUrl: null,
    demoUrl: null,
    comingSoon: true,
  },
  {
    id: 5,
    emoji: '💰',
    name: 'BudgetBuddy',
    description:
      'Responsive personal finance dashboard for tracking income and expenses, setting monthly category budgets, exporting transaction data, and analyzing spending patterns.',
    tags: ['JavaScript', 'CSS', 'LocalStorage', 'Analytics'],
    gradient: 'from-amber-500 to-orange-500',
    githubUrl: 'https://github.com/rabinregmi188/Budgetbuddy',
    demoUrl: '/budgetbuddy/',
    comingSoon: false,
  },
  {
    id: 6,
    emoji: '🖼️',
    name: 'Image Classifier',
    description:
      'CNN-based image classification model trained with PyTorch and deployed as an interactive web demo. Upload any image and watch the AI identify it in real time.',
    tags: ['Python', 'PyTorch', 'FastAPI', 'Streamlit'],
    gradient: 'from-rose-500 to-violet-600',
    githubUrl: null,
    demoUrl: null,
    comingSoon: true,
  },
]

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
    { threshold: 0.1 }
  )
  document.querySelectorAll('#projects .reveal').forEach((el) => observer.observe(el))
})
</script>

<template>
  <section
    id="projects"
    class="section-padding bg-slate-50 dark:bg-slate-900"
    aria-labelledby="projects-heading"
  >
    <div class="max-w-6xl mx-auto">

      <!-- Section header -->
      <div class="text-center mb-14 reveal">
        <p class="font-mono text-indigo-500 dark:text-indigo-400 text-sm uppercase tracking-widest mb-2">What I've built</p>
        <h2 id="projects-heading" class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Featured <span class="gradient-text">Projects</span>
        </h2>
        <p class="mt-3 text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          A mix of shipped products and projects in the pipeline. More coming soon!
        </p>
      </div>

      <!-- Project cards grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <article
          v-for="(project, index) in projects"
          :key="project.id"
          class="reveal group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-md border border-slate-100 dark:border-slate-700 card-hover"
          :style="`animation-delay: ${index * 100}ms`"
          :aria-label="project.name"
        >
          <!-- Gradient header banner -->
          <div
            :class="`bg-gradient-to-r ${project.gradient} h-24 flex items-center justify-center relative`"
          >
            <span class="text-5xl drop-shadow-md" role="img" :aria-label="project.name">{{ project.emoji }}</span>
            <!-- Coming soon badge -->
            <span
              v-if="project.comingSoon"
              class="absolute top-3 right-3 px-2 py-1 text-xs font-bold bg-white/20 backdrop-blur-sm text-white rounded-full border border-white/30"
              aria-label="Coming soon"
            >
              Coming Soon
            </span>
          </div>

          <!-- Card body -->
          <div class="p-6 flex flex-col h-full">
            <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
              {{ project.name }}
            </h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4 flex-1">
              {{ project.description }}
            </p>

            <!-- Tech tags -->
            <div class="flex flex-wrap gap-2 mb-5" aria-label="Technologies used">
              <span
                v-for="tag in project.tags"
                :key="tag"
                class="skill-badge text-xs"
              >
                {{ tag }}
              </span>
            </div>

            <!-- Action buttons -->
            <div v-if="!project.comingSoon" class="flex gap-3">
              <a
                v-if="project.githubUrl"
                :href="project.githubUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-slate-900 dark:bg-slate-700 text-white hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                :aria-label="`View ${project.name} source code on GitHub`"
              >
                <!-- GitHub icon -->
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
                View Code
              </a>
              <a
                v-if="project.demoUrl"
                :href="project.demoUrl"
                class="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-indigo-500 text-white hover:bg-indigo-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                :aria-label="`View live demo of ${project.name}`"
              >
                <!-- External link icon -->
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open App
              </a>
            </div>

            <!-- Coming soon placeholder -->
            <div v-else class="flex items-center gap-2 text-sm text-slate-400 dark:text-slate-500">
              <span>🔨</span>
              <span>In development — stay tuned!</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
