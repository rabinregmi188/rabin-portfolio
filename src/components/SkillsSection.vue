<script setup>
import { ref, onMounted } from 'vue'

// Active tab
const activeTab = ref('languages')

const tabs = [
  { id: 'languages', label: 'Languages' },
  { id: 'frameworks', label: 'Frameworks & Libraries' },
  { id: 'tools', label: 'Tools & Platforms' },
]

const skills = {
  languages: [
    { name: 'HTML/CSS', icon: '🎨', level: 90 },
    { name: 'Python', icon: '🐍', level: 85 },
    { name: 'JavaScript', icon: '⚡', level: 80 },
    { name: 'C++', icon: '⚙️', level: 75 },
    { name: 'Java', icon: '☕', level: 70 },
    { name: 'C', icon: '🔩', level: 70 },
    { name: 'SQL', icon: '🗄️', level: 65 },
  ],
  frameworks: [
    { name: 'Vue.js', icon: '💚', level: 80 },
    { name: 'Node.js', icon: '🟢', level: 75 },
    { name: 'Express', icon: '🚂', level: 70 },
    { name: 'PyTorch', icon: '🔥', level: 60 },
  ],
  tools: [
    { name: 'VS Code', icon: '💻', level: 90 },
    { name: 'Git / GitHub', icon: '🐙', level: 85 },
    { name: 'Linux', icon: '🐧', level: 70 },
    { name: 'Docker', icon: '🐳', level: 60 },
    { name: 'AWS', icon: '☁️', level: 55 },
  ],
}

// Track which skills have had their bars animated
const animated = ref(false)

function animateBars() {
  if (animated.value) return
  animated.value = true
  // Reset & retrigger width on next tick so transition plays
  setTimeout(() => {
    document.querySelectorAll('.progress-bar').forEach((bar) => {
      bar.style.width = bar.dataset.level + '%'
    })
  }, 100)
}

function switchTab(tab) {
  activeTab.value = tab
  // Re-animate whenever tab changes
  animated.value = false
  setTimeout(() => {
    document.querySelectorAll('.progress-bar').forEach((bar) => {
      bar.style.width = '0%'
    })
    setTimeout(() => {
      document.querySelectorAll('.progress-bar').forEach((bar) => {
        bar.style.width = bar.dataset.level + '%'
      })
    }, 100)
  }, 10)
}

// Intersection Observer to trigger animation
onMounted(() => {
  const section = document.getElementById('skills')
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Reveal elements
          section.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'))
          animateBars()
        }
      })
    },
    { threshold: 0.2 }
  )
  if (section) observer.observe(section)
})
</script>

<template>
  <section
    id="skills"
    class="section-padding bg-white dark:bg-slate-800"
    aria-labelledby="skills-heading"
  >
    <div class="max-w-4xl mx-auto">

      <!-- Section header -->
      <div class="text-center mb-12 reveal">
        <p class="font-mono text-indigo-500 dark:text-indigo-400 text-sm uppercase tracking-widest mb-2">What I know</p>
        <h2 id="skills-heading" class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          My <span class="gradient-text">Skills</span>
        </h2>
        <p class="mt-3 text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Technologies I work with, from systems programming to modern web frameworks.
        </p>
      </div>

      <!-- Tabs -->
      <div class="flex flex-wrap justify-center gap-2 mb-10 reveal" role="tablist" aria-label="Skill categories">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="switchTab(tab.id)"
          role="tab"
          :aria-selected="activeTab === tab.id"
          :class="[
            'px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500',
            activeTab === tab.id
              ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-600',
          ]"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Skill cards -->
      <div
        role="tabpanel"
        :aria-label="tabs.find(t => t.id === activeTab)?.label"
        class="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <div
          v-for="(skill, index) in skills[activeTab]"
          :key="skill.name"
          class="reveal bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200 card-hover"
          :style="`animation-delay: ${index * 80}ms`"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="text-2xl" aria-hidden="true">{{ skill.icon }}</span>
              <span class="font-semibold text-slate-800 dark:text-slate-100">{{ skill.name }}</span>
            </div>
            <span class="font-mono text-sm text-indigo-500 dark:text-indigo-400 font-bold">{{ skill.level }}%</span>
          </div>

          <!-- Progress bar track -->
          <div class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden" role="progressbar"
               :aria-valuenow="skill.level" aria-valuemin="0" aria-valuemax="100"
               :aria-label="`${skill.name} proficiency`">
            <div
              class="progress-bar h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500"
              :data-level="skill.level"
              style="width: 0%; transition: width 1.2s ease;"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
