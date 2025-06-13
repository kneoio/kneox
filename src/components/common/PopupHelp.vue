<template>
  <div class="popup-help">
    <h2>Enable Downloads</h2>
    <p>
      <strong>{{ $route.query.filename }}</strong> couldn't download automatically.
    </p>
    <ol>
      <li>Click the browser's address bar</li>
      <li>Look for the popup blocker icon <img src="popup-icon.png" width="16"></li>
      <li>Select "Always allow popups from this site"</li>
    </ol>
    <button @click="retryDownload">Retry Download</button>
  </div>
</template>

<script setup>
import {useRouter} from "vue-router";

const router = useRouter();

const retryDownload = () => {
  router.go(-1); // Go back to trigger download again
};
</script>