// for support ArrayBuffer
import "crypto-js/lib-typedarrays"
import "crypto-js/sha1"
import CryptoJS from "crypto-js/core";
import HashServiceWorker from "./hashService.worker?worker"
import type { HashServiceEvent } from "@/types/hashService";


/**
 * - worker pool
 * - share worker
 */
class HashService {
  static #worker: Worker

  constructor () {
    if (!HashService.#worker) {
      HashService.register()
    }
  }

  get worker() {
   return HashService.#worker 
  }

  static register() {
    if (HashService.#worker) return
    HashService.#worker = new HashServiceWorker
    const worker = HashService.#worker
    worker.addEventListener("message", (ev) => {

    })
  }

  async calcSha1(buffer: ArrayBuffer) {
    const ev: HashServiceEvent = {
      name: "calcHash",
      args: [buffer]
    }
    HashService.#worker.postMessage(ev, {transfer: [buffer]})
  }

  static unRegister() {
    if (HashService.#worker) {
      HashService.#worker.terminate()
    }
  }
}


export {HashService}