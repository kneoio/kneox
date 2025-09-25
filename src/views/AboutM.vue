<template>
  <n-config-provider :theme="isDarkTheme ? darkTheme : null">
    <n-layout :style="{ minHeight: '100vh', backgroundColor: isDarkTheme ? '#1a1a1a' : '#f8f8f8' }">
      <n-layout-header bordered :style="{ background: 'transparent' }">
        <n-space align="center" justify="space-between" :wrap="false" :style="{ maxWidth: '720px', margin: '0 auto', padding: '12px 16px' }">
          <router-link to="/m" class="inline-block">
            <n-button quaternary>← Back</n-button>
          </router-link>
        </n-space>
      </n-layout-header>
      <n-layout-content :style="{ padding: '0 16px 24px' }">
        <div :style="{ maxWidth: '720px', margin: '0 auto' }">
          <n-space vertical size="large">
            <n-card title="Privacy & Cookies" :segmented="{ content: true }">
              <n-text>
                <strong>What we use</strong><br>
                - Only strictly necessary cookies/storage (authentication, basic session, theme preference).<br>
                - No analytics, ad trackers, or marketing pixels are loaded.<br><br>
                <strong>Uploads & processing</strong><br>
                - When you upload audio, we process it to extract technical/metadata needed to operate your station (e.g., title/artist if available).<br>
                - Processing status may be tracked to show progress in the UI.<br><br>
                <strong>Consent banner</strong><br>
                - A minimal banner is shown to inform you about necessary cookies. Your choice is stored in a cookie ("cookie_consent").<br>
                - You can clear your browser cookies to see the banner again or change your choice later when a full consent manager is added.<br><br>
                <strong>Contact</strong><br>
                For privacy questions or requests, email: <a href="mailto:justaidajam@gmail.com" style="color: #2196F3; text-decoration: underline;">justaidajam@gmail.com</a>
              </n-text>
            </n-card>

            <n-card title="About the Project and For Potential Investors" :segmented="{ content: true }">
              <n-text>
                Mixpla lets anyone create their own radio station with AI DJs. Upload your music, choose a personality, and get a radio station that adapts to different situations and talks between songs.<br><br>
                <strong>The Problem</strong><br>
                Radio is outdated, streaming is impersonal. Plus, creators using AI to generate audio content need somewhere to publish it.<br><br>
                <strong>Our Solution</strong><br>
                Simple platform where AI DJs create real radio experiences with weather updates, stories, and personality. We also provide a distribution channel for AI-generated audio content.<br><br>
                <strong>Why This Works</strong><br>
                Users pay monthly for premium features, our costs are low, and the economics are profitable. Each new station makes the platform more valuable.<br><br>
                <strong>Why Now</strong><br>
                The project is currently self-funded, but the market is becoming more competitive. We need investment to grow and capture market share before larger competitors enter.<br><br>
                Mixpla offers an opportunity to invest in a simple, profitable platform for audio creators.<br><br>
                <strong>I can provide detailed financial projections, technical specifications, and growth strategies upon request.</strong>
              </n-text>
            </n-card>

            <n-card :segmented="{ content: true }">
              <template #header>
                <strong>Support on Patreon</strong>
              </template>
              <n-text class="mb-5 block" style="color: inherit;">
                If you'd like to support the journey and get updates, you can join via Patreon.
              </n-text>
              <a
                href="https://www.patreon.com/posts/new-chapter-137017251?utm_medium=clipboard_copy&utm_source=copyLink&utm_campaign=postshare_creator&utm_content=join_link"
                target="_blank"
                style="color: #2196F3; text-decoration: underline; font-weight: bold;"
              >
                Visit Patreon
              </a>
            </n-card>

            <n-card title="Who I Am" :segmented="{ content: true }">
              <n-text>
                <strong>About the Founder</strong><br><br>
                I am an experienced full-stack developer with many years in the enterprise sector. After mastering team collaboration, tool utilization, and time management in complex technical environments, I decided to leverage my expertise to create something transformative.<br><br>
                This led me to develop Mixpla: AI-Driven Radio - a platform that redefines how people experience and create audio content. My vision was simple: What if radio could be truly personal and interactive?<br><br>
                Mixpla empowers anyone to become a radio station owner, integrating their music libraries with intelligent AI DJs that have distinct personalities. It's more than streaming - it's a creative canvas with seamless content integration, robust HLS-based streaming, and dynamic content that adapts to any environment.<br><br>
                I'm dedicated to providing tools for a new generation of audio creators, combining my enterprise-level technical skills with innovative AI technology to continuously expand what radio can be.<br><br>
                <strong>Contact:</strong> <a href="mailto:justaidajam@gmail.com" style="color: #2196F3; text-decoration: underline;">justaidajam@gmail.com</a>
              </n-text>
            </n-card>
          </n-space>
        </div>
      </n-layout-content>
    </n-layout>
  </n-config-provider>
</template>

<script setup lang="ts">
import { inject, ref, type Ref } from 'vue'
import { NConfigProvider, NLayout, NLayoutHeader, NLayoutContent, NSpace, NCard, NText, NButton, darkTheme } from 'naive-ui'
const isDarkTheme = inject<Ref<boolean>>('isDarkTheme', ref(false))
</script>

<style scoped>
</style>
