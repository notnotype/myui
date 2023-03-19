import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'


type UploadTask = {
  chunk: Blob
  chunkId: number
  chunkHash: string
  uuid: string
  args: AxiosRequestConfig
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
    args: AxiosRequestConfig
  ) {
    this.tasks.push({ chunk, chunkId, chunkHash, uuid, args })
  }

  private async uploadWorker() {
    while (this.tasks.length) {
      const { chunk, chunkId, chunkHash, uuid, args } = this.tasks.splice(0, 1)[0]
      const formData = new FormData()
      formData.append('file', chunk)
      const resp = await axios.post(
        `http://localhost:8000/upload_chunk?chunk=${chunkId}&chunk_hash=${chunkHash}&uuid=${uuid}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          ...args
        }
      )
      if (resp.data['code']) {
        console.error(resp.data['code'] + resp.data['msg'])
      }
    }
  }

  async upload(workerCount: number) {
    console.log("workerCount: ", workerCount)
    for (let i = 0; i < workerCount; i++) {
      this.workers.push(this.uploadWorker())
    }
    await Promise.all(this.workers)
    this.workers.length = 0
  }
}
