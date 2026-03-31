<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// --- Typewriter effect ---
const typewriterText = ref('')
const showCursor = ref(true)

const phrases = ['CS Student', 'Full-Stack Developer', 'ML Enthusiast', 'Problem Solver']
let phraseIndex = 0
let charIndex = 0
let isDeleting = false
let timer = null

function typeLoop() {
  const current = phrases[phraseIndex]

  if (isDeleting) {
    typewriterText.value = current.substring(0, charIndex - 1)
    charIndex--
  } else {
    typewriterText.value = current.substring(0, charIndex + 1)
    charIndex++
  }

  let delay = isDeleting ? 60 : 110

  if (!isDeleting && charIndex === current.length) {
    // Pause at end of word
    delay = 1600
    isDeleting = true
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false
    phraseIndex = (phraseIndex + 1) % phrases.length
    delay = 400
  }

  timer = setTimeout(typeLoop, delay)
}

// Scroll helpers
function scrollToProjects() {
  const el = document.getElementById('projects')
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 72
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

function scrollToAbout() {
  const el = document.getElementById('about')
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 72
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

onMounted(() => {
  // Small start delay for page-load feel
  timer = setTimeout(typeLoop, 600)
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <section
    id="home"
    class="relative min-h-screen flex flex-col items-center justify-center overflow-hidden gradient-bg"
    aria-label="Hero section"
  >
    <!-- Floating geometric shapes (decorative) -->
    <div aria-hidden="true">
      <div class="shape" style="width:300px;height:300px;top:-80px;left:-80px;background:rgba(99,102,241,0.5);animation:float 7s ease-in-out infinite;"></div>
      <div class="shape shape-reverse" style="width:200px;height:200px;top:10%;right:-60px;background:rgba(139,92,246,0.5);animation:float-reverse 9s ease-in-out infinite;"></div>
      <div class="shape" style="width:150px;height:150px;bottom:15%;left:5%;background:rgba(6,182,212,0.5);animation:float 8s ease-in-out infinite 1s;"></div>
      <div class="shape shape-reverse" style="width:100px;height:100px;bottom:25%;right:10%;background:rgba(99,102,241,0.4);animation:float-reverse 6s ease-in-out infinite 2s;"></div>
      <div class="shape" style="width:60px;height:60px;top:30%;left:20%;background:rgba(6,182,212,0.4);animation:float 10s ease-in-out infinite 0.5s;"></div>
    </div>

    <!-- Hero content -->
    <div class="relative z-10 text-center px-4 max-w-4xl mx-auto">
      <!-- Greeting chip -->
      <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-sm font-mono mb-6">
        <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
        Available for opportunities
      </div>

      <!-- Main heading -->
      <h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-4">
        Hey, I'm
        <span class="block mt-1 drop-shadow-lg">Rabin Regmi</span>
      </h1>

      <!-- Typewriter subtitle -->
      <div class="text-xl sm:text-2xl md:text-3xl font-mono text-white/80 mb-8 h-10 flex items-center justify-center gap-1">
        <span>I'm a </span>
        <span class="text-cyan-300 font-semibold">{{ typewriterText }}</span>
        <span class="typewriter-cursor text-cyan-300" aria-hidden="true"></span>
      </div>

      <!-- Short tagline -->
      <p class="text-base sm:text-lg text-white/70 max-w-xl mx-auto mb-10 leading-relaxed">
        CS student at ULM passionate about building impactful software —
        from full-stack web apps to machine learning projects.
      </p>

      <!-- CTA buttons -->
      <div class="flex flex-wrap items-center justify-center gap-4">
        <button
          @click="scrollToProjects"
          class="btn-primary text-base shadow-lg shadow-indigo-500/30"
          aria-label="View my projects"
        >
          View My Work 🚀
        </button>
        <a
          href="/resume.pdf"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-secondary bg-white/10 border-white/50 text-white hover:bg-white hover:text-indigo-600 text-base"
          aria-label="Download resume"
        >
          Download Resume 📄
        </a>
      </div>
    </div>

    <!-- Scroll-down indicator -->
    <button
      @click="scrollToAbout"
      class="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 hover:text-white transition-colors focus:outline-none animate-bounce"
      aria-label="Scroll down"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  </section>
</template>
