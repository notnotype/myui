import { calcBlobSha1, calcSha1 } from '@/utils'
import axios, { type AxiosResponse } from 'axios'
import type { AxiosRequestConfig } from 'axios'

const MAX_RETRIES = 3

type UploadTask = {
  chunk: Blob
  chunkId: number
  chunkHash: string
  uuid: string
  args: AxiosRequestConfig
  retries?: number
}

class UploadProgress {
  percent: number = 0
  uploaded: number = 0
  total: number = 0
}

type Chunk = {
  chunkSlice: [number, number]  // byte
  chunkId: number,
  chunkHash: string,
  uploaded: boolean,
  percent: number,
  total: number,
}
export class UploadState {
  blob: Blob
  filename: string
  uuid: string
  // progress: UploadProgress = new UploadProgress()
  private chunks: Chunk[] = []

  constructor(blob: Blob, filename: string, uuid: string) {
    this.blob = blob
    this.filename = filename
    this.uuid = uuid
  }

  addUploadedChunk(chunk: Chunk) {
    this.chunks.push(chunk)
  }

  nextSlice(maxChunkSize: number): [number, number] {
    const lastSlice = this.chunks.length ? this.chunks[this.chunks.length - 1].chunkSlice : [0, 0]
    if (lastSlice[1] >= this.blob.size) return [-1, -1]
    if (this.blob.size - lastSlice[1] >= maxChunkSize) {
      return [lastSlice[1], lastSlice[1] + maxChunkSize]
    } else {
      return [lastSlice[1], this.blob.size]
    }
  }
}

export class UploadService {
  public tasks: UploadTask[]
  public workers: Promise<void>[]

  constructor() {
    this.tasks = []
    this.workers = []
  }

  addTask(
    chunk: Blob,
    chunkId: number,
    chunkHash: string,
    uuid: string,
    args: AxiosRequestConfig,
    retries?: number,
  ) {
    this.tasks.push({ chunk, chunkId, chunkHash, uuid, args, retries })
  }

  private async uploadWorker() {
    while (this.tasks.length) {
      const { chunk, chunkId, chunkHash, uuid, args, retries } = this.tasks.splice(0, 1)[0]
      const formData = new FormData()
      formData.append('file', chunk)

      try {
        const resp = await axios.post(
          `https://localhost:8000/upload_chunk?chunk=${chunkId}&chunk_hash=${chunkHash}&uuid=${uuid}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            ...args
          }
        )
        if (resp.data['code']) {
          throw new Error(resp.data['code'] + resp.data['msg'])
        }
      } catch (err) {
        if (!retries || retries < MAX_RETRIES) {
          this.addTask(chunk, chunkId, chunkHash, uuid, args, (retries || 0) + 1)
        } else {
          throw err
        }
      }
    }
  }

  async upload(workerCount: number) {
    for (let i = 0; i < workerCount; i++) {
      this.workers.push(this.uploadWorker())
    }
    await Promise.all(this.workers)
    this.workers.length = 0
  }

  async uploadBlob(state: UploadState, chunkSize: number) {
    const chunkCount = Math.ceil(state.blob.size / chunkSize)
    for (let i = 0; i < chunkCount; i++) {
      const slice = state.nextSlice(chunkSize)
      const slicedBlob = state.blob.slice(...slice)
      const slicedHash = await calcBlobSha1(slicedBlob)
      const chunk: Chunk = {
        chunkId: i,
        chunkHash: slicedHash,
        chunkSlice: slice,
        uploaded: false,
        percent: 0,
        total: slicedBlob.size,
      }

      this.addTask(slicedBlob, i, slicedHash, state.uuid, {
        onUploadProgress: (ev) => {
          chunk.percent = ev.progress || 0
        }
      })
      
      state.addUploadedChunk(chunk)
    }
    await this.upload(5)
  }

  async resumeUpload(state: UploadState) {
    
  }
}
