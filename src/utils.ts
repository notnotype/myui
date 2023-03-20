
// for support ArrayBuffer
import "crypto-js/lib-typedarrays"
import "crypto-js/sha1"
import CryptoJS from "crypto-js/core";

export async function readeFileBlob(blob: Blob): Promise<ArrayBuffer> {
    const reader = new FileReader()
    return new Promise<ArrayBuffer>((resolve, reject) => {
      reader.onload = () => {
        resolve(reader.result as ArrayBuffer)
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(blob)
    })
  }

export function calcSha1(buffer: ArrayBuffer): string {
    const wordArray = CryptoJS.lib.WordArray.create(buffer as any)
    return CryptoJS.SHA1(wordArray).toString()
}

export async function calcBlobSha1(blob: Blob): Promise<string> {
    const buffer = await readeFileBlob(blob)
    return calcSha1(buffer)
}