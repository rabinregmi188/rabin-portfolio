<script setup>
import { ref, onMounted } from 'vue'

// Form state
const form = ref({ name: '', email: '', message: '' })
const status = ref('idle') // 'idle' | 'sending' | 'success' | 'error'

async function handleSubmit() {
  status.value = 'sending'
  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        // TODO: Replace with your actual key from https://web3forms.com (free, no backend required).
        // Store in an environment variable (VITE_WEB3FORMS_KEY) before deploying:
        //   access_key: import.meta.env.VITE_WEB3FORMS_KEY,
        access_key: 'YOUR_ACCESS_KEY_HERE',
        name: form.value.name,
        email: form.value.email,
        message: form.value.message,
        subject: `Portfolio Contact from ${form.value.name}`,
      }),
    })
    const data = await res.json()
    if (data.success) {
      status.value = 'success'
      form.value = { name: '', email: '', message: '' }
    } else {
      status.value = 'error'
    }
  } catch {
    status.value = 'error'
  }
}

// Scroll reveal
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
  document.querySelectorAll('#contact .reveal').forEach((el) => observer.observe(el))
})
</script>

<template>
  <section
    id="contact"
    class="section-padding bg-white dark:bg-slate-800"
    aria-labelledby="contact-heading"
  >
    <div class="max-w-3xl mx-auto">

      <!-- Section header -->
      <div class="text-center mb-12 reveal">
        <p class="font-mono text-indigo-500 dark:text-indigo-400 text-sm uppercase tracking-widest mb-2">Let's connect</p>
        <h2 id="contact-heading" class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Get In <span class="gradient-text">Touch</span>
        </h2>
        <p class="mt-4 text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
          I'm currently open to new opportunities. Whether you have a question or just want to say hi,
          I'll get back to you!
        </p>
      </div>

      <!-- Contact form card -->
      <div class="reveal bg-slate-50 dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-700" style="animation-delay:0.15s">
        <form @submit.prevent="handleSubmit" novalidate aria-label="Contact form">
          <div class="space-y-5">

            <!-- Name -->
            <div>
              <label for="contact-name" class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Your Name
              </label>
              <input
                id="contact-name"
                v-model="form.name"
                type="text"
                required
                autocomplete="name"
                placeholder="Rabin Regmi"
                class="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <!-- Email -->
            <div>
              <label for="contact-email" class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                id="contact-email"
                v-model="form.email"
                type="email"
                required
                autocomplete="email"
                placeholder="you@example.com"
                class="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <!-- Message -->
            <div>
              <label for="contact-message" class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Message
              </label>
              <textarea
                id="contact-message"
                v-model="form.message"
                required
                rows="5"
                placeholder="Hi Rabin, I'd love to connect about..."
                class="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none"
              ></textarea>
            </div>

            <!-- Submit button -->
            <button
              type="submit"
              :disabled="status === 'sending'"
              class="w-full btn-primary text-base py-4 shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="status === 'sending'">Sending... ✈️</span>
              <span v-else>Send Message 🚀</span>
            </button>

            <!-- Status messages -->
            <p
              v-if="status === 'success'"
              class="text-center text-green-600 dark:text-green-400 font-semibold"
              role="alert"
            >
              ✅ Message sent! I'll get back to you soon.
            </p>
            <p
              v-if="status === 'error'"
              class="text-center text-red-500 dark:text-red-400 font-semibold"
              role="alert"
            >
              ❌ Something went wrong. Please email me directly at
              <a href="mailto:rregmi967@gmail.com" class="underline hover:text-red-400">rregmi967@gmail.com</a>
            </p>
          </div>
        </form>
      </div>

      <!-- Social links row -->
      <div class="flex justify-center gap-6 mt-10 reveal" style="animation-delay:0.3s" aria-label="Social media links">

        <!-- LinkedIn -->
        <a
          href="https://www.linkedin.com/in/rabin-regmi-63785b256"
          target="_blank"
          rel="noopener noreferrer"
          class="group flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Connect on LinkedIn"
        >
          <!-- LinkedIn SVG -->
          <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">LinkedIn</span>
        </a>

        <!-- GitHub -->
        <a
          href="https://github.com/rabinregmi188"
          target="_blank"
          rel="noopener noreferrer"
          class="group flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500"
          aria-label="View GitHub profile"
        >
          <!-- GitHub SVG -->
          <svg class="w-5 h-5 text-slate-800 dark:text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
          </svg>
          <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">GitHub</span>
        </a>

        <!-- Email -->
        <a
          href="mailto:rregmi967@gmail.com"
          class="group flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-red-400 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
          aria-label="Send an email"
        >
          <!-- Email SVG -->
          <svg class="w-5 h-5 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">Email</span>
        </a>
      </div>
    </div>
  </section>
</template>
