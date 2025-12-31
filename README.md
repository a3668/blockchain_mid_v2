deno run --allow-read --allow-net src/server.ts
blockchain_mid_v2 是加功能版本

#### 挖礦流程

```
[使用者在瀏覽器按下「挖礦」按鈕]
│
▼
app.js 的 mineWithData() 被呼叫
│
│ 發送 HTTP POST /add-data，並附上輸入資料
▼
server.ts 收到 /add-data
│
│ 建立一個新的 Block 物件
▼
呼叫 blockchain.addBlock(newBlock)
│
│ 在 addBlock() 裡
│ ├─ 設定 index
│ ├─ 設定 previousHash
│ └─ await newBlock.mineBlock(difficulty)
▼
block.ts 的 mineBlock() 開始挖礦
│
│ while 迴圈：
│ ├─ calculateHash()
│ └─ nonce++
│ 重複直到 hash 開頭符合難度
▼
mineBlock() 結束 → 回到 addBlock()
│
│ addBlock() 將 newBlock 推入鏈
▼
server.ts 回應「已挖出新的 Block」
│
│ 前端 mineWithData() 再呼叫 fetchChain()
▼
app.js 發送 GET /chain
│
▼
server.ts 回傳整條區塊鏈資料
│
▼
app.js 更新畫面，顯示所有區塊（含新挖出的）
```

---

#### 錢包簽名與驗證
