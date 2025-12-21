/// <reference lib="deno.ns" />

import { Block } from "./block.ts"

export class Blockchain {
    chain: Block[]
    difficulty: number

    constructor() {
        this.chain = [this.createGenesisBlock()]
        this.difficulty = 2
    }

    createGenesisBlock(): Block {
        const genesis = new Block(0, 0, "Genesis Block", "0")
        genesis.nonce = 0
        genesis.hash =
            "64f7b89238d2fba6619759197d7329d363ad5bb925ba477de55718950422879e"
        return genesis
    }

    getLatestBlock(): Block {
        return this.chain[this.chain.length - 1]
    }

    async addBlock(newBlock: Block): Promise<void> {
        // 1) 自動更新 index（關鍵修正）
        newBlock.index = this.getLatestBlock().index + 1

        // 2) 設定 previousHash
        newBlock.previousHash = this.getLatestBlock().hash

        // 3) 挖礦
        await newBlock.mineBlock(this.difficulty)

        // 4) 推入鏈
        this.chain.push(newBlock)
    }

    isValid(): boolean {
        for (let i = 1; i < this.chain.length; i++) {
            const current = this.chain[i]
            const previous = this.chain[i - 1]

            if (current.previousHash !== previous.hash) {
                return false
            }
        }
        return true
    }
}
