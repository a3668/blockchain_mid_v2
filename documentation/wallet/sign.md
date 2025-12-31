#### 簽名流程

[Elliptic Curve 與 secp256k1](https://hackmd.io/oFmZZHamQUOKG9DHhEV7lw)

```

```

##### signMessage

-   const msgHash = sha256(utf8ToBytes(message))
    將訊息轉成 UTF-8 bytes 後再做 sha256
-   const privateKey = hexToBytes(privateKeyHex)
    將 hex 格式私鑰轉成 raw bytes
    因為 簽名演算法需要的是真正的 bytes
-   const signature = secp.sign(msgHash, privateKey, { prehash: false })
    簽名演算法 簽名時 把 ECDSA 套用在 secp256k1 這條曲線上
    用私鑰在 secp256k1 曲線上執行 ECDSA 簽名，得到 raw bytes
    signature = r 的 32 bytes + s 的 32 bytes
-   bytesToHex(signature)
    把簽名的 raw bytes（Uint8Array 64 bytes）轉成 16 進位字串形式
