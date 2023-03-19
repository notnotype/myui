import type { HashServiceEvent } from "@/types/hashService"
// import {HashService} from "./hashService"

console.log("hashService.worker.js loaded")

function calcSha1(buffer: ArrayBuffer) {
    const wordArray = CryptoJS.lib.WordArray.create(buffer as any)
    return CryptoJS.SHA1(wordArray).toString()
}

onmessage = function(ev: MessageEvent) {
    const data: HashServiceEvent = ev.data
    switch (data.name) {
        case "calcHash":
            // calcSha1(...data.args)
            break
        default:
            console.warn("Unsupported name: %s", data.name)
    }
    console.log(data)
}

