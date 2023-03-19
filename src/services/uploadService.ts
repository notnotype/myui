import axios from 'axios'
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
    retries?: number
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
}
