<script setup lang="ts">

import { ref } from "vue";
import MyUpload from "./components/MyUpload/MyUpload.vue"

const uploadThread = ref<number>(5)

</script>

<template>
  <div id="app">
    <label for="inputUploadThread">上传线程数：</label>
    <input type="number" v-model="uploadThread" name="inputUploadThread">
    <my-upload :workersCount="uploadThread" />
  </div>
</template>

<style scoped lang="scss"></style>
