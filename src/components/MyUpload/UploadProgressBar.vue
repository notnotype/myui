<script setup lang="ts">
import type { AxiosProgressEvent } from 'axios';

const props = defineProps<{
    progress: AxiosProgressEvent[]
}>()
</script>

<template>
    <div class="upload-progress-bar__container">
        <ul class="upload-progress-bar__ul" :style="{'--column': props.progress.length}">
            <li v-for="progress, index in props.progress" :key="index" class="upload-progress-bar__li"
                :style="{'--width': (progress.progress || 0) * 100 + '%'}">
            </li>
        </ul>
    </div>
</template>

<style lang="scss" scoped>
.upload-progress-bar__container {
    border: solid pink 1px;

    .upload-progress-bar__ul {
        margin: 0;
        padding: 0;
        list-style-type: none;
        display: flex;
        flex-flow: row;
        height: 1em;

        .upload-progress-bar__li {
            flex: 1;
            box-sizing: border-box;
            // border: solid blue 1px;
            position: relative;
            
            &::before {
                content: "";
                background: yellow;
                position: absolute;
                height: 1em;
                width: var(--width);
            }
        }
    }
}
</style>