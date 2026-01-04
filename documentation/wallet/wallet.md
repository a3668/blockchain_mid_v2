#### 錢包

##### 產生地址

1. 使用密碼學安全的隨機數生成器 (CSPRNG) 產生 32 bytes 的 secp256k1 私鑰
   privateKey = generatePrivateKey()
   [randomSecretKey()](https://github.com/paulmillr/noble-secp256k1?utm_source=chatgpt.com)
2. 使用橢圓曲線運算[secp256k1](https://en.bitcoin.it/wiki/Secp256k1)由私鑰推導公鑰
   [Elliptic Curve 與 secp256k1](https://hackmd.io/oFmZZHamQUOKG9DHhEV7lw)
   publicKeyCompressed = secp.getPublicKey(privateKey, true)
   true 是壓縮

-   publicKey = privateKey × G
    G：曲線的基點
    壓縮公鑰（33 bytes）常用於地址推導
    d \* G = 用點加與點倍重複構造的曲線點，輸出 (x,y)，再壓縮成 33 bytes。
    -   secp256k1 的橢圓曲線方程
        $y^2 \equiv x^3 + 7 \pmod{p}$

3. 計算公鑰的 HASH160
   為縮短與避免直接暴露公鑰，對公鑰做雙重雜湊
   h160 = hash160(publicKeyCompressed)
    - 公鑰 → SHA256 → RIPEMD160 → 20 bytes → 用來生成地址

```
export function hash160(data: Uint8Array): Uint8Array {
    const s256 = sha256(data)
    return ripemd160(s256)
}
```

-   加上版本前綴
    版本前綴用來 區分主網 / 測試網
    同時也決定地址的開頭字母型態

```
const version = network === "mainnet" ? 0x00 : 0x6f
const payload = concatBytes(Uint8Array.from([version]), h160)
```

4. 進行 [Base58Check](https://blog.csdn.net/QQ604666459/article/details/82419527) 編碼（可讀 + checksum）

-   checksum = SHA256(SHA256(payload)) 的前 4 bytes
-   createBase58check 內部會自動實作 checksum
-   將 checksum 加在 payload 後面
-   對完整資料做 Base58 編碼
    得到可公開、可讀的 P2PKH 地址

```
const b58check = createBase58check(sha256)
return b58check.encode(payload)
```
