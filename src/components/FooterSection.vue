<script setup>
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const year = new Date().getFullYear()
</script>

<template>
  <footer
    class="bg-slate-900 dark:bg-slate-950 border-t border-slate-700/50"
    role="contentinfo"
    aria-label="Site footer"
  >
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">

        <!-- Copyright -->
        <p class="text-sm text-slate-400 text-center sm:text-left">
          © {{ year }} <span class="font-semibold text-white">Rabin Regmi</span>.
          Built with
          <span class="text-green-400 font-semibold">Vue.js</span> &amp;
          <span class="text-cyan-400 font-semibold">Tailwind CSS</span> 💙
        </p>

        <!-- Back to top button -->
        <button
          @click="scrollToTop"
          class="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 group"
          aria-label="Back to top of page"
        >
          <span>Back to top</span>
          <svg class="w-4 h-4 transition-transform group-hover:-translate-y-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>
    </div>
  </footer>
</template>
