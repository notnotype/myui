<script setup lang="ts">
import { onMounted, ref } from 'vue';
import axios from "axios"

// for support ArrayBuffer
import "crypto-js/lib-typedarrays"
import "crypto-js/sha1"
import CryptoJS from "crypto-js/core";

import {v4 as uuidv4} from "uuid"

const CHUNK_SIZE = 1024 * 1024

const fileInput = ref<HTMLInputElement>()
onMounted(()=>{
  console.log(fileInput)
})

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
  
  for (let i=0; i<chunkCount; i++) {
    let chunked = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
    let chunkedData = await readeFileBlob(chunked)
    let sha1 = calcSha1(chunkedData)
    yield [chunked, sha1, index++]
  }
}


async function uploadChunk(chunk: Blob, chunkId: number, chunkHash: string, uuid: string) {
  let formData = new FormData()
  formData.append("file", chunk)
  let rst = await axios.post(`http://localhost:8000/upload?chunk=${chunkId}&chunk_hash=${chunkHash}&uuid=${uuid}`, 
    formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  })
  console.log(rst.data)
  if (rst.data["code"]) {
    throw Error(rst.data["code"] + rst.data["msg"])
  }
}

async function onSubmit() {
  if(!fileInput.value?.files?.length) {
    alert("please select file")
    return
  }
  const file = fileInput.value.files[0]
  const uuid = uuidv4().replaceAll("-", "")
  for await (let [chunk, sha1, index] of chunkFile(file)) {
    console.log(chunk, sha1, index)
    await uploadChunk(chunk, index, sha1, uuid)
  }
  let resp = await axios.put(`http://localhost:8000/upload_end?uuid=${uuid}&filename=${file.name}`)
  console.log(resp.data)
}

</script>

<template>
  <div class="my-upload">
    <form action="#" @submit.prevent="onSubmit">
      <input type="file" name="file" ref="fileInput"/>
      <input type="submit" />
    </form>
  </div>
</template>

<style lang="scss">
.my-upload {
  border: solid 1 red;
}
</style>