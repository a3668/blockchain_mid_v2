#### 簽名流程

[Elliptic Curve 與 secp256k1](https://hackmd.io/oFmZZHamQUOKG9DHhEV7lw)
簽名時 把 ECDSA 套用在 secp256k1 這條曲線上

```

```

##### signMessage

-   const msgHash = sha256(utf8ToBytes(message))
    將訊息轉成 UTF-8 bytes 後再做 sha256
-   const privateKey = hexToBytes(privateKeyHex)
    將 hex 格式私鑰轉成 raw bytes
    因為 簽名演算法需要的是真正的 bytes
