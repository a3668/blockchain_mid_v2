// wallet.ts
// Minimal BTC-style wallet primitives (private key -> public key -> P2PKH address).
// Notes:
// - Private key MUST be generated from a CSPRNG. Do not derive it from username.
// - Do not send privateKey to frontend in real apps.

import { sha256 } from "@noble/hashes/sha2.js"
import { ripemd160 } from "@noble/hashes/legacy.js"

import * as secp from "@noble/secp256k1"
import { createBase58check } from "@scure/base"

export type Network = "mainnet" | "testnet"

export type Wallet = {
    label?: string
    network: Network

    // Raw bytes
    privateKey: Uint8Array // 32 bytes
    publicKeyCompressed: Uint8Array // 33 bytes (default in Bitcoin)
    publicKeyUncompressed: Uint8Array // 65 bytes

    // Common representations
    privateKeyHex: string
    publicKeyCompressedHex: string
    publicKeyUncompressedHex: string

    // Bitcoin legacy address (P2PKH, Base58Check)
    addressP2PKH: string

    createdAt: number
}

export function createWallet(
    label?: string,
    network: Network = "mainnet"
): Wallet {
    const privateKey = generatePrivateKey()
    const publicKeyCompressed = secp.getPublicKey(privateKey, true)
    const publicKeyUncompressed = secp.getPublicKey(privateKey, false)

    const addressP2PKH = publicKeyToP2PKHAddress(publicKeyCompressed, network)

    return {
        label,
        network,
        privateKey,
        publicKeyCompressed,
        publicKeyUncompressed,
        privateKeyHex: bytesToHex(privateKey),
        publicKeyCompressedHex: bytesToHex(publicKeyCompressed),
        publicKeyUncompressedHex: bytesToHex(publicKeyUncompressed),
        addressP2PKH,
        createdAt: Date.now()
    }
}

export function generatePrivateKey(): Uint8Array {
    // noble guarantees the secret key is within curve order
    // (and uses crypto.getRandomValues under the hood).
    return secp.utils.randomSecretKey()
}

export function publicKeyToP2PKHAddress(
    publicKeyCompressed: Uint8Array,
    network: Network = "mainnet"
): string {
    // hash160(pubkey) = RIPEMD160(SHA256(pubkey))
    const h160 = hash160(publicKeyCompressed)

    // version prefix: 0x00 mainnet, 0x6f testnet
    const version = network === "mainnet" ? 0x00 : 0x6f
    const payload = concatBytes(Uint8Array.from([version]), h160)

    // Base58Check = base58(payload + checksum), checksum = first4bytes(SHA256(SHA256(payload)))
    const b58check = createBase58check(sha256)
    return b58check.encode(payload)
}

export function hash160(data: Uint8Array): Uint8Array {
    const s256 = sha256(data)
    return ripemd160(s256)
}
// ==============================
// Digital Signature
// ==============================

export function signMessage(message: string, privateKeyHex: string): string {
    // SHA256(UTF-8(message))
    const msgHash = sha256(utf8ToBytes(message))

    // 將 privateKeyHex 轉成 Uint8Array
    const privateKey = hexToBytes(privateKeyHex)

    // secp256k1 compact signature (64 bytes: r || s)
    const signature = secp.sign(msgHash, privateKey)

    return bytesToHex(signature)
}

export function verifySignature(
    message: string,
    signatureHex: string,
    publicKeyHex: string
): boolean {
    const msgHash = sha256(utf8ToBytes(message))

    const signature = hexToBytes(signatureHex)
    const publicKey = hexToBytes(publicKeyHex)

    return secp.verify(signature, msgHash, publicKey)
}

// ==============================
// Helpers (local)
// ==============================

function utf8ToBytes(str: string): Uint8Array {
    return new TextEncoder().encode(str)
}

function hexToBytes(hex: string): Uint8Array {
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
}

function bytesToHex(bytes: Uint8Array): string {
    let out = ""
    for (let i = 0; i < bytes.length; i += 1) {
        out += bytes[i]!.toString(16).padStart(2, "0")
    }
    return out
}

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
    const out = new Uint8Array(a.length + b.length)
    out.set(a, 0)
    out.set(b, a.length)
    return out
}
