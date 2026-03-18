<template>
  <div class="dash" :class="{ 'dash--light': !isDarkTheme }" ref="dashRoot">

    <!-- header -->
    <div class="dash-header" ref="dashHeader">
      <div class="dash-brand">
        <span class="dash-brand-name">{{ brandName }}</span>
        <span class="dash-brand-sub">station dashboard</span>
      </div>
      <div class="dash-status-wrap">
        <span class="dash-pill" :class="store.statusPillClass">
          <span class="dash-pill-dot"></span>
          {{ store.statusPillText }}
        </span>
        <span class="dash-zone">zone / {{ store.stationDetails?.zoneId || 'N/A' }}</span>
      </div>
    </div>

    <!-- stat row -->
    <div class="dash-stats" ref="dashStats">
      <div class="dash-stat">
        <span class="dash-stat-val" ref="statRegular">{{ store.regularQueueLength }}</span>
        <span class="dash-stat-label">regular queue</span>
      </div>
      <div class="dash-stat-divider"></div>
      <div class="dash-stat">
        <span class="dash-stat-val accent2" ref="statPriority">{{ store.prioritizedQueueLength }}</span>
        <span class="dash-stat-label">priority queue</span>
      </div>
      <div class="dash-stat-divider"></div>
      <div class="dash-stat">
        <span class="dash-stat-val muted">{{ store.lastUpdateTime }}</span>
        <span class="dash-stat-label">last update</span>
      </div>
    </div>

    <!-- queues -->
    <div class="dash-queues" ref="dashQueues">

      <!-- regular -->
      <div class="dash-queue-panel">
        <div class="dash-queue-header">
          <span class="dash-queue-title">Regular</span>
          <span class="dash-queue-count">{{ store.regularQueueLength }}</span>
        </div>
        <div class="dash-queue-body">
          <div v-if="store.regularQueueSongs.length === 0" class="dash-empty">
            <span>queue empty</span>
          </div>
          <TransitionGroup v-else name="song" tag="div">
            <div
              v-for="(song, i) in store.regularQueueSongs"
              :key="song.songId"
              class="dash-song"
            >
              <div class="dash-song-index">{{ i + 1 }}</div>
              <div class="dash-song-info">
                <span class="dash-song-title">{{ song.title || 'Untitled' }}</span>
                <span class="dash-song-meta">
                  {{ song.artist || 'Unknown' }}
                  <span v-if="song.duration" class="dash-song-dur"> · {{ song.duration }}s</span>
                </span>
              </div>
              <div v-if="song.genre" class="dash-song-genre">{{ song.genre }}</div>
            </div>
          </TransitionGroup>
        </div>
      </div>

      <!-- priority -->
      <div class="dash-queue-panel priority">
        <div class="dash-queue-header">
          <span class="dash-queue-title">Priority</span>
          <span class="dash-queue-count priority">{{ store.prioritizedQueueLength }}</span>
        </div>
        <div class="dash-queue-body">
          <div v-if="store.prioritizedQueueSongs.length === 0" class="dash-empty">
            <span>queue empty</span>
          </div>
          <TransitionGroup v-else name="song-priority" tag="div">
            <div
              v-for="(song, i) in store.prioritizedQueueSongs"
              :key="song.songId"
              class="dash-song priority"
            >
              <div class="dash-song-index priority">{{ i + 1 }}</div>
              <div class="dash-song-info">
                <span class="dash-song-title">{{ song.title || 'Untitled' }}</span>
                <span class="dash-song-meta">
                  {{ song.artist || 'Unknown' }}
                  <span v-if="song.duration" class="dash-song-dur"> · {{ song.duration }}s</span>
                </span>
              </div>
              <div v-if="song.genre" class="dash-song-genre priority">{{ song.genre }}</div>
            </div>
          </TransitionGroup>
        </div>
      </div>

    </div>

    <div class="dash-waiting" v-if="!store.hasQueueData" ref="dashWaiting">
      <span class="dash-waiting-dot"></span>
      <span>waiting for queue data</span>
    </div>

  </div>
</template>

<script lang="ts">
import { defineComponent, inject, onMounted, onUnmounted, ref, watch } from 'vue';
import gsap from 'gsap';
import { useStationDashboardStore } from '../../../stores/stationDashboardStore';

export default defineComponent({
  name: 'StationDashboard',
  props: {
    brandName: { type: String, required: true }
  },
  setup(props: { brandName: string }) {
    const isDarkTheme = inject('isDarkTheme', ref(true));
    const store = useStationDashboardStore();

    const dashRoot = ref<HTMLElement | null>(null);
    const dashHeader = ref<HTMLElement | null>(null);
    const dashStats = ref<HTMLElement | null>(null);
    const dashQueues = ref<HTMLElement | null>(null);
    const dashWaiting = ref<HTMLElement | null>(null);
    const statRegular = ref<HTMLElement | null>(null);
    const statPriority = ref<HTMLElement | null>(null);

    const animateCounter = (el: HTMLElement | null, to: number) => {
      if (!el) return;
      const current = parseFloat(el.textContent || '0') || 0;
      if (current === to) return;
      const obj = { val: current };
      gsap.to(obj, {
        val: to, duration: 0.6, ease: 'power2.out',
        onUpdate: () => { el.textContent = String(Math.round(obj.val)); }
      });
    };

    watch(() => store.regularQueueLength, (val) => animateCounter(statRegular.value, val));
    watch(() => store.prioritizedQueueLength, (val) => animateCounter(statPriority.value, val));
    watch(() => props.brandName, (newBrand) => {
      if (newBrand) {
        store.disconnect();
        store.connect(newBrand);
      }
    });

    onMounted(() => {
      store.connect(props.brandName);
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      if (dashHeader.value) tl.from(dashHeader.value, { y: -20, opacity: 0, duration: 0.5 });
      if (dashStats.value) tl.from(dashStats.value.children, { y: 12, opacity: 0, duration: 0.4, stagger: 0.07 }, '-=0.2');
      if (dashQueues.value) tl.from(dashQueues.value.children, { y: 20, opacity: 0, duration: 0.45, stagger: 0.12 }, '-=0.1');
    });

    onUnmounted(() => store.disconnect());

    return {
      isDarkTheme,
      store,
      dashRoot, dashHeader, dashStats, dashQueues, dashWaiting, statRegular, statPriority,
      brandName: props.brandName
    };
  }
});
</script>

<style scoped>
/* ── dark (default) ──────────────────────────────────────── */
.dash {
  --accent:  #2196F3;
  --accent2: #9336f7;
  --surface:  #2a2a2a;
  --surface2: #222222;
  --border:   #383838;
  --border-bright: #484848;
  --text:     #f0f0f0;
  --muted:    #888888;
  --dimmed:   #555555;
  padding: 2rem 2.5rem;
  position: relative;
  color: var(--text);
}

/* ── light ───────────────────────────────────────────────── */
.dash--light {
  --accent:  #003f5c;
  --accent2: #9336f7;
  --surface:  #f4f4f4;
  --surface2: #ebebeb;
  --border:   #e0e0e0;
  --border-bright: #cccccc;
  --text:     #1a1a1a;
  --muted:    #666666;
  --dimmed:   #aaaaaa;
}

.dash--light .dash-pill.online  { background: rgba(0,63,92,0.08);  color: var(--accent); border-color: rgba(0,63,92,0.3); }
.dash--light .dash-queue-count  { background: rgba(0,63,92,0.07);  color: var(--accent); border-color: rgba(0,63,92,0.2); }
.dash--light .dash-song-genre   { background: rgba(0,63,92,0.06);  color: var(--accent); border-color: rgba(0,63,92,0.15); }
.dash--light::before { display: none; }

.dash::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(33,150,243,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(33,150,243,0.03) 1px, transparent 1px);
  background-size: 36px 36px;
  pointer-events: none;
  z-index: 0;
}

/* ── header ──────────────────────────────────────────────── */
.dash-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.dash-brand { display: flex; flex-direction: column; gap: 4px; }

.dash-brand-name {
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 2px;
  text-transform: uppercase;
  line-height: 1;
}

.dash-brand-sub {
  font-size: 0.65rem;
  letter-spacing: 4px;
  color: var(--muted);
  text-transform: uppercase;
}

.dash-status-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.dash-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  padding: 6px 14px;
  border-radius: 999px;
}

.dash-pill.online  { background: rgba(33,150,243,0.12); color: var(--accent);  border: 1px solid rgba(33,150,243,0.3); }
.dash-pill.warming { background: rgba(243,156,18,0.12); color: #f39c12;       border: 1px solid rgba(243,156,18,0.3); }
.dash-pill.offline { background: rgba(231,76,60,0.12);  color: #e74c3c;       border: 1px solid rgba(231,76,60,0.3); }

.dash-pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.dash-pill.online .dash-pill-dot { animation: blink-dot 1.4s ease-in-out infinite; }

@keyframes blink-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}

.dash-zone {
  font-size: 0.65rem;
  letter-spacing: 2px;
  color: var(--muted);
  text-transform: uppercase;
  border: 1px solid var(--border-bright);
  padding: 5px 12px;
  border-radius: 6px;
}

/* ── stat row ────────────────────────────────────────────── */
.dash-stats {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  margin-bottom: 2rem;
  overflow: hidden;
}

.dash-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 1.25rem 1rem;
}

.dash-stat-divider {
  width: 1px;
  height: 40px;
  background: var(--border);
  flex-shrink: 0;
}

.dash-stat-val {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.dash-stat-val.accent2 { color: var(--accent2); }
.dash-stat-val.muted   { font-size: 1rem; color: var(--muted); }

.dash-stat-label {
  font-size: 0.6rem;
  letter-spacing: 2px;
  color: var(--muted);
  text-transform: uppercase;
}

/* ── queues ──────────────────────────────────────────────── */
.dash-queues {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 700px) { .dash-queues { grid-template-columns: 1fr; } }

.dash-queue-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}

.dash-queue-panel.priority { border-color: rgba(147,54,247,0.2); }

.dash-queue-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1.2rem;
  border-bottom: 1px solid var(--border);
  background: var(--surface2);
}

.dash-queue-title {
  font-size: 0.65rem;
  letter-spacing: 3px;
  color: var(--muted);
  text-transform: uppercase;
  font-weight: 600;
}

.dash-queue-count {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--accent);
  background: rgba(33,150,243,0.1);
  border: 1px solid rgba(33,150,243,0.2);
  padding: 2px 10px;
  border-radius: 999px;
}

.dash-queue-count.priority {
  color: var(--accent2);
  background: rgba(147,54,247,0.1);
  border-color: rgba(147,54,247,0.25);
}

.dash-queue-body {
  max-height: 420px;
  overflow-y: auto;
}

.dash-queue-body::-webkit-scrollbar { width: 3px; }
.dash-queue-body::-webkit-scrollbar-thumb { background: var(--border-bright); border-radius: 2px; }

/* ── TransitionGroup animations ──────────────────────────── */

/* regular queue — slide from left */
.song-enter-active  { transition: all 0.3s ease; }
.song-leave-active  { transition: all 0.2s ease; position: absolute; width: 100%; }
.song-move          { transition: transform 0.35s ease; }
.song-enter-from    { opacity: 0; transform: translateX(-14px); }
.song-leave-to      { opacity: 0; transform: translateX(-14px); }

/* priority queue — slide from right */
.song-priority-enter-active  { transition: all 0.3s ease; }
.song-priority-leave-active  { transition: all 0.2s ease; position: absolute; width: 100%; }
.song-priority-move          { transition: transform 0.35s ease; }
.song-priority-enter-from    { opacity: 0; transform: translateX(14px); }
.song-priority-leave-to      { opacity: 0; transform: translateX(14px); }

/* song row */
.dash-song {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 1.2rem;
  border-bottom: 1px solid var(--border);
  transition: background 0.15s ease;
}

.dash-song:last-child { border-bottom: none; }
.dash-song:hover { background: rgba(255,255,255,0.03); }

.dash-song-index {
  font-size: 0.6rem;
  color: var(--dimmed);
  min-width: 18px;
  text-align: right;
  flex-shrink: 0;
}

.dash-song-index.priority { color: rgba(147,54,247,0.5); }

.dash-song-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.dash-song-title {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dash-song-meta {
  font-size: 0.68rem;
  color: var(--muted);
}

.dash-song-dur { color: var(--dimmed); }

.dash-song-genre {
  font-size: 0.58rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--accent);
  background: rgba(33,150,243,0.08);
  border: 1px solid rgba(33,150,243,0.15);
  padding: 2px 7px;
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
}

.dash-song-genre.priority {
  color: var(--accent2);
  background: rgba(147,54,247,0.08);
  border-color: rgba(147,54,247,0.2);
}

.dash-empty {
  padding: 2rem;
  text-align: center;
  font-size: 0.65rem;
  letter-spacing: 2px;
  color: var(--dimmed);
  text-transform: uppercase;
}

.dash-waiting {
  position: relative;
  z-index: 1;
  margin-top: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 0.65rem;
  letter-spacing: 3px;
  color: var(--dimmed);
  text-transform: uppercase;
  padding: 2rem;
  border: 1px dashed var(--border);
  border-radius: 10px;
}

.dash-waiting-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--muted);
  animation: blink-dot 1.4s ease-in-out infinite;
}
</style>