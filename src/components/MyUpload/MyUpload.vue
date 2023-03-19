<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { v4 as uuidv4 } from "uuid"
import axios, { type AxiosProgressEvent } from "axios"

// for support ArrayBuffer
import "crypto-js/lib-typedarrays"
import "crypto-js/sha1"
import CryptoJS from "crypto-js/core";
import { UploadService } from '@/services/uploadService';
import UploadProgressBar from './UploadProgressBar.vue';


const CHUNK_SIZE = 1024 * 64

const props = defineProps<{
  workersCount: number
}>()

const fileInput = ref<HTMLInputElement>()

async function readeFileBlob(blob: Blob) {
  const reader = new FileReader()
  return new Promise<ArrayBuffer>((resolve, reject) => {
    reader.onload = () => {
      resolve(reader.result as ArrayBuffer)
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(blob)
  })
}

function calcSha1(buffer: ArrayBuffer) {
  const wordArray = CryptoJS.lib.WordArray.create(buffer as any)
  return CryptoJS.SHA1(wordArray).toString()
}

/**
 * 异步生成器函数 ES2018
 * 
 * @link https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-3.html#async-iteration
 */
async function* chunkFile(file: File): AsyncGenerator<[Blob, string, number]> {
  let index = 0
  const chunkCount = Math.ceil(file.size / CHUNK_SIZE)

  for (let i = 0; i < chunkCount; i++) {
    let chunked = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
    let chunkedData = await readeFileBlob(chunked)
    let sha1 = calcSha1(chunkedData)
    yield [chunked, sha1, index++]
  }
}

async function getUploaded(uuid: string) {
  const resp = await axios.get(`https://localhost:8000/upload_progress?uuid=${uuid}`)
  return resp.data
}

function setProgress(file: Blob) {
  const fileChunkCount = Math.ceil(file.size / CHUNK_SIZE)
  uploadProgress.value.length = 0
  for (let i = 0; i < fileChunkCount; i++) uploadProgress.value.push({ loaded: 0, bytes: 0 })
}

const uploadProgress = ref<(AxiosProgressEvent)[]>([])

async function onSubmit() {
  if (!fileInput.value?.files?.length) {
    alert("please select file")
    return
  }
  const file = fileInput.value.files[0]
  setProgress(file)
  const uuid = uuidv4().replaceAll("-", "")
  const uploader = new UploadService()

  for await (let [chunk, sha1, index] of chunkFile(file)) {
    // console.log(chunk, sha1, index)
    uploader.addTask(chunk, index, sha1, uuid, {
      onUploadProgress: function (ev) {
        uploadProgress.value[index] = ev
      }
    })
  }

  await uploader.upload(props.workersCount)

  // amend file
  let resp = await axios.put(`https://localhost:8000/upload_end?uuid=${uuid}&filename=${file.name}`)
  if (resp.data["code"] == 0) {
    console.log("上传成功")
  } else {
    console.log("上传失败：文件合并失败")
  }
}

</script>

<template>
  <div class="my-upload">
    <form action="#" @submit.prevent="onSubmit">
      <input type="file" name="file" ref="fileInput" />
      <input type="submit" />
      <UploadProgressBar :progress="uploadProgress" />
    </form>
  </div>
</template>

<style lang="scss">
.my-upload {
  border: solid 1 red;
}
</style>