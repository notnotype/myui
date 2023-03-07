<script setup lang="ts">
import { onMounted, ref } from 'vue';
import axios from "axios"

const CHUNK_SIZE = 64 * 1024

const fileInput = ref<HTMLInputElement>()
onMounted(()=>{
  console.log(fileInput)
})

function* chunkFile(file: File): Generator<[Blob, number]> {
  let index = 0
  let chunkCount = Math.ceil(file.size / CHUNK_SIZE)
  for (let i=0; i<chunkCount; i++) {
    yield [file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE), index++]
  }
}

async function uploadChunk(chunk: Blob, chunkId: number) {
  let formData = new FormData()
  formData.append("file", chunk)
  let rst = await axios.post(`http://localhost:8000/upload?chunk=${chunkId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  })
  console.log(rst.data)
}

async function onSubmit(ev: Event) {
  if(!fileInput.value?.files?.length) {
    alert("please select file")
    return
  }
  let file = fileInput.value.files[0]
  let chunked = chunkFile(file)
  // for (let each of chunked) {
  //   console.log(each)
  // }
  for (let [chunk, index] of chunked) {
    console.log(chunk)
    await uploadChunk(chunk, index)
  }

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