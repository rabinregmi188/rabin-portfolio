<div align="center">

# 🌐 Rabin Regmi — Personal Portfolio

[![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

A production-ready personal portfolio website for **Rabin Regmi** — CS student, Full-Stack Developer & ML Enthusiast. Built with Vue.js 3, Tailwind CSS, and Vite.

**[🔗 Live Demo](rabin-portfolio-rust.vercel.app)** &nbsp;|&nbsp; **[📸 Screenshot](#screenshot)**

</div>

---

## 📸 Screenshot

> _Screenshot placeholder — add your own after deployment!_

---

## ✨ Features

- 🌙 **Dark / Light Mode** — Toggleable, persists in `localStorage`, defaults to dark
- ⌨️ **Typewriter Effect** — Pure JS cycling hero text (no external libs)
- 🎨 **Animated Gradient Hero** — Shifting indigo → violet → cyan background
- 📊 **Animated Skill Bars** — Triggered by Intersection Observer on scroll
- 🃏 **Hover Project Cards** — Lift + shadow glow effect on hover
- 📱 **Fully Responsive** — Mobile-first, hamburger menu on small screens
- 📬 **Contact Form** — Functional via [Web3Forms](https://web3forms.com/) (no backend)
- ♿ **Accessible** — Semantic HTML, ARIA labels, keyboard navigation
- 🚀 **Fast** — Vite build, minimal dependencies, optimised assets

---

## 🗂️ Project Structure

```
rabin-portfolio/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/             # profile.jpg goes here
│   ├── components/
│   │   ├── NavBar.vue          # Sticky glassmorphism navbar
│   │   ├── HeroSection.vue     # Typewriter + animated gradient
│   │   ├── AboutSection.vue    # Bio + quick stats
│   │   ├── SkillsSection.vue   # Tabbed skills + progress bars
│   │   ├── ProjectsSection.vue # 6 project cards
│   │   ├── ContactSection.vue  # Form + social links
│   │   └── FooterSection.vue   # Back-to-top footer
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── index.html
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
└── package.json
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Vue.js 3 (Composition API) | Frontend framework |
| Tailwind CSS 3 | Utility-first styling |
| Vite 5 | Build tool & dev server |
| Vue Router 4 | SPA navigation / smooth scroll |
| Web3Forms | Contact form (free, no backend) |
| Vercel | Hosting & deployment |

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Clone & Install

```bash
git clone https://github.com/rabinregmi188/rabin-portfolio.git
cd rabin-portfolio
npm install
```

### Development server

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### Production build

```bash
npm run build
npm run preview   # preview the production build locally
```

---

## 📬 Contact Form Setup

The contact form uses [Web3Forms](https://web3forms.com/) — completely free, no backend required.

1. Go to [web3forms.com](https://web3forms.com/) and enter your email
2. Copy the **Access Key** you receive
3. Open `src/components/ContactSection.vue`
4. Replace `YOUR_ACCESS_KEY_HERE` with your key

---

## 🖼️ Adding Your Profile Photo

1. Save your photo as `profile.jpg`
2. Place it in `src/assets/profile.jpg`
3. In `AboutSection.vue`, uncomment the `<img>` tag and remove the initials fallback

---

## ☁️ Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com/) and import the repository
3. Vercel auto-detects Vite — just click **Deploy**

---

## 📄 License

MIT © 2026 Rabin Regmi

---

## 📫 Contact

| Channel | Link |
|---|---|
| Email | rregmi967@gmail.com |
| LinkedIn | https://www.linkedin.com/in/rabin-regmi-63785b256 |
| GitHub | https://github.com/rabinregmi188 |
