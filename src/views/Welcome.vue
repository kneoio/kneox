<template>
  <n-config-provider :theme="darkTheme">
    <div class="welcome-page">
      <header class="nav">
        <div class="logo">MIXPLA</div>
        <img src="/logo.svg" alt="MIXPLA" class="nav-logo">
        <nav>
          <a href="#platform">Platform</a>
          <a href="#creators">Broadcasters</a>
          <a href="#about">About</a>
        </nav>
      </header>

      <section class="hero" id="platform">
        <div class="hero-text">
          <p class="eyebrow">You choose the vibe. AI keeps it live.</p>
          <h1>AI-Driven Streams, Events and Audio Experiences.</h1>
          <p class="subline">Streams that never sleep. Personalised. Interactive. Alive.</p>
          <div class="hero-ctas">
            <n-button type="primary" size="large" class="cta-button" @click="goToMixpla">Mixplay Music</n-button>
            <n-button type="primary" size="large" @click="scrollToRegister">Become a Broadcaster</n-button>
            <n-button size="large" @click="goToBrands">Access Broadcaster Portal</n-button>
          </div>
        </div>
        <div class="waveform" aria-hidden="true">
          <span v-for="bar in 32" :key="bar" />
        </div>
      </section>

      <section class="what-is" id="about">
        <div class="section-header">
          <p class="eyebrow">What is Mixpla</p>
          <h2>Audio infrastructure engineered for continuous AI performance.</h2>
          <p class="intro">Mixpla powers autonomous AI streams, one-off shows and monetisation for broadcasters building the next generation of sonic experiences.</p>
        </div>
        <div class="cards">
          <article>
            <h3>Continuous AI Streams</h3>
            <p>24/7 AI DJ with live listener chat, adaptive programming and telemetry-grade observability.</p>
          </article>
          <article>
            <h3>One-Time Streams</h3>
            <p>Personalised audio for events, launches, workouts or birthdays with scripted AI hosts.</p>
          </article>
          <article>
            <h3>Marketplace</h3>
            <p>Broadcasters sell scripts, playlists and DJ styles directly into the Mixpla ecosystem.</p>
          </article>
        </div>
      </section>

      <section class="highlights">
        <div>24/7 Uptime</div>
        <div>AI DJ always on</div>
        <div>Scales from 1 to millions</div>
        <div>Made in Europe</div>
      </section>

      <section class="creator-portal" id="creators">
        <div>
          <p class="eyebrow">For Broadcasters</p>
          <h2>Operate your AI stream, own your scripts, ship paid experiences.</h2>
          <p>Set up stations, manage pipelines and monetise with enterprise tooling built for audio teams.</p>
          <span class="badge">🔒 Protected — Login Required</span>
        </div>
        <n-button type="primary" size="large" @click="goToBrands">Access Broadcaster Portal</n-button>
      </section>

      <section class="register" id="register">
        <div class="section-header">
          <p class="eyebrow">Register as Broadcaster</p>
          <h2>Apply for Broadcaster Access.</h2>
          <p>Authentication powered by Keycloak — full portal coming soon.</p>
        </div>
        <form class="register-form" @submit.prevent="handleCreatorSubmit">
          <n-input v-model:value="creatorForm.name" placeholder="Name" size="large" required />
          <n-input v-model:value="creatorForm.email" placeholder="Email" size="large" required />
          <n-input v-model:value="creatorForm.channel" placeholder="Channel / Website" size="large" required />
          <n-button type="primary" attr-type="submit" size="large">Apply for Broadcaster Access</n-button>
        </form>
        <p v-if="submitted" class="success">Application received. We'll reach out soon.</p>
      </section>

      <footer class="footer">
        <div class="logo">MIXPLA</div>
        <div class="footer-links">
          <a href="#platform">Platform</a>
          <a href="#creators">Broadcasters</a>
          <a href="#about">About</a>
        </div>
        <div class="status">● Live — Running 24/7</div>
        <div class="copyright">© Mixpla</div>
        <a class="affiliation" href="https://semantyca.com" target="_blank" rel="noopener noreferrer">Part of Semantyca</a>
      </footer>
    </div>
  </n-config-provider>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { NButton, NConfigProvider, NInput, darkTheme } from 'naive-ui'

const creatorForm = reactive({
  name: '',
  email: '',
  channel: ''
})

const submitted = ref(false)

function goToMixpla() {
  window.open('https://mixpla.online', '_blank', 'noopener,noreferrer')
}

function goToBrands() {
  window.location.href = '/outline/brands'
}

function scrollToRegister() {
  document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' })
}

function handleCreatorSubmit() {
  submitted.value = true
}
</script>

<style scoped>
/* unchanged */
</style>