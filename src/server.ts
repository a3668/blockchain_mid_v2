/// <reference lib="deno.ns" />

import { Blockchain } from "./blockchain.ts"
import { Block } from "./block.ts"
import { createWallet } from "./wallet.ts"

const blockchain = new Blockchain()
const port = 8000

function jsonResponse(body: unknown, init?: ResponseInit): Response {
    return new Response(JSON.stringify(body), {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers ?? {})
        }
    })
}

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
