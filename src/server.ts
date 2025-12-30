/// <reference lib="deno.ns" />

import { Blockchain } from "./blockchain.ts"
import { Block } from "./block.ts"
import { createWallet, signMessage, verifySignature } from "./wallet.ts"
//import * as secp from "@noble/secp256k1"
import type { Wallet } from "./wallet.ts"

const blockchain = new Blockchain()
const port = 8000
let currentWallet: Wallet | null = null

function jsonResponse(body: unknown, init?: ResponseInit): Response {
    return new Response(JSON.stringify(body), {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers ?? {})
        }
    })
}
/*function bytesToHex(bytes: Uint8Array): string {
    let out = ""
    for (let i = 0; i < bytes.length; i += 1) {
        out += bytes[i]!.toString(16).padStart(2, "0")
    }
    return out
}*/

/*function hexToBytes(hex: string): Uint8Array {
    const normalized = hex.trim().toLowerCase()
    if (normalized.length % 2 !== 0) {
        throw new Error("hex string must have even length")
    }

    const out = new Uint8Array(normalized.length / 2)
    for (let i = 0; i < out.length; i += 1) {
        const byte = normalized.slice(i * 2, i * 2 + 2)
        const value = Number.parseInt(byte, 16)
        if (Number.isNaN(value)) {
            throw new Error("invalid hex string")
        }
        out[i] = value
    }
    return out
}*/

Deno.serve({ port }, async (req) => {
    const url = new URL(req.url)

    // ---------- Blockchain APIs ----------

    if (url.pathname === "/chain") {
        return jsonResponse(blockchain.chain, { status: 200 })
    }

    if (url.pathname === "/mine" && req.method === "POST") {
        const block = new Block(
            blockchain.chain.length,
            Date.now(),
            "Empty Data",
            ""
        )
        await blockchain.addBlock(block)

        return jsonResponse({ message: "Block mined!" }, { status: 200 })
    }

    if (url.pathname === "/add-data" && req.method === "POST") {
        const body = await req.json()
        const data = body.data ?? "No Data"

        const block = new Block(blockchain.chain.length, Date.now(), data, "")
        await blockchain.addBlock(block)

        return jsonResponse(
            { message: "Block with data mined!" },
            { status: 200 }
        )
    }
    // wallet new
    if (url.pathname === "/wallet/new" && req.method === "POST") {
        let body: Record<string, unknown> = {}
        try {
            const parsed: unknown = await req.json()
            if (
                parsed !== null &&
                typeof parsed === "object" &&
                !Array.isArray(parsed)
            ) {
                body = parsed as Record<string, unknown>
            } else {
                body = {}
            }
        } catch {
            body = {}
        }

        const label =
            typeof body.label === "string" && body.label.length > 0
                ? body.label
                : undefined

        const network = body.network === "testnet" ? "testnet" : "mainnet"

        const includePrivate = url.searchParams.get("includePrivate") === "1"

        const wallet = createWallet(label, network)
        currentWallet = wallet

        const resp: Record<string, unknown> = {
            label: wallet.label,
            network: wallet.network,
            publicKeyCompressedHex: wallet.publicKeyCompressedHex,
            addressP2PKH: wallet.addressP2PKH
        }

        // 僅示範：若 includePrivate=1 才回傳私鑰 hex
        if (includePrivate) {
            resp.privateKeyHex = wallet.privateKeyHex
        }

        return jsonResponse(resp, { status: 200 })
    }
    // wallet sign
    // wallet sign (server holds the private key)
    if (url.pathname === "/wallet/sign" && req.method === "POST") {
        if (!currentWallet) {
            return jsonResponse(
                { error: "wallet not initialized" },
                { status: 400 }
            )
        }

        let body: Record<string, unknown> = {}
        try {
            const parsed: unknown = await req.json()
            if (
                parsed !== null &&
                typeof parsed === "object" &&
                !Array.isArray(parsed)
            ) {
                body = parsed as Record<string, unknown>
            } else {
                body = {}
            }
        } catch {
            body = {}
        }

        const message = typeof body.message === "string" ? body.message : ""

        if (!message) {
            return jsonResponse(
                { error: "message is required" },
                { status: 400 }
            )
        }

        try {
            const signatureHex = signMessage(
                message,
                currentWallet.privateKeyHex
            )

            return jsonResponse(
                {
                    signatureHex,
                    publicKeyCompressedHex: currentWallet.publicKeyCompressedHex
                },
                { status: 200 }
            )
        } catch (err) {
            console.error(err)
            return jsonResponse({ error: "sign failed" }, { status: 400 })
        }
    }

    // wallet verify
    if (url.pathname === "/wallet/verify" && req.method === "POST") {
        let body: Record<string, unknown> = {}
        try {
            const parsed: unknown = await req.json()
            if (
                parsed !== null &&
                typeof parsed === "object" &&
                !Array.isArray(parsed)
            ) {
                body = parsed as Record<string, unknown>
            } else {
                body = {}
            }
        } catch {
            body = {}
        }

        const message = typeof body.message === "string" ? body.message : ""
        const signatureHex =
            typeof body.signatureHex === "string" ? body.signatureHex : ""
        const publicKeyHex =
            typeof body.publicKeyHex === "string" ? body.publicKeyHex : ""

        if (!message || !signatureHex || !publicKeyHex) {
            return jsonResponse(
                { error: "message, signatureHex, publicKeyHex are required" },
                { status: 400 }
            )
        }

        try {
            const valid = verifySignature(message, signatureHex, publicKeyHex)
            return jsonResponse({ valid }, { status: 200 })
        } catch (err) {
            console.error(err)
            return jsonResponse(
                { error: "invalid input or verify failed" },
                { status: 400 }
            )
        }
    }

    // ---------- Static files (public/) ----------

    let filePath = url.pathname
    if (filePath === "/") {
        filePath = "/index.html"
    }

    try {
        const file = await Deno.readFile(`./public${filePath}`)

        const contentType = (() => {
            if (filePath.endsWith(".html")) return "text/html"
            if (filePath.endsWith(".js")) return "application/javascript"
            if (filePath.endsWith(".css")) return "text/css"
            return "application/octet-stream"
        })()

        return new Response(file, {
            headers: { "Content-Type": contentType }
        })
    } catch {
        return new Response("Not Found", { status: 404 })
    }
})

console.log(`Server running at http://localhost:${port}`)
