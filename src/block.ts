export class Block {
    index: number
    timestamp: number
    data: unknown
    previousHash: string
    nonce: number
    hash: string

    constructor(
        index: number,
        timestamp: number,
        data: unknown,
        previousHash: string
    ) {
        this.index = index
        this.timestamp = timestamp
        this.data = data
        this.previousHash = previousHash
        this.nonce = 0
        this.hash = ""
    }

    async calculateHash(): Promise<string> {
        const raw =
            this.index +
            this.timestamp +
            this.previousHash +
            JSON.stringify(this.data) +
            this.nonce

        const encoder = new TextEncoder()
        const buffer = encoder.encode(raw)

        const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashHex = hashArray
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")
        return hashHex
    }
    async mineBlock(difficulty: number): Promise<void> {
        const target = "0".repeat(difficulty)

        while (true) {
            this.hash = await this.calculateHash()

            if (this.hash.startsWith(target)) {
                // 挖礦成功
                break
            }

            this.nonce++
        }
    }
}
