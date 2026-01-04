#### 簽名流程

[Elliptic Curve 與 secp256k1](https://hackmd.io/oFmZZHamQUOKG9DHhEV7lw)

[韋達](https://timmychiang.medium.com/橢圓曲線加密的數學基礎與方法-b0696c0e2986)

[橢圓加法](https://drops.dagstuhl.de/storage/00lipics/lipics-vol268-itp2023/LIPIcs.ITP.2023.6/LIPIcs.ITP.2023.6.pdf?utm_source=chatgpt.com)

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

###### 簽名演算法

目標 signature = (r, s)

-   message → z = sha256(utf8ToBytes(message))
-   private key → d (32-byte 整數)
-   curve base point → G (secp256k1 定義好的生成點)
-   curve order → n

1. 隨機挑選一次性隨機數 k (RFC6979)
2. 計算 R = k \* G（椭圓曲線上的點乘）
3. 取 R 的 x 座標，計算 r
   $r = x_R \bmod n$
4. 計算 s
   $s = k^{-1} (z + rd) \bmod n$

##### verifySignature

-   const msgHash = sha256(utf8ToBytes(message))
    將 message 轉成 SHA-256 雜湊

-   const signature = hexToBytes(signatureHex)
-   const publicKey = hexToBytes(publicKeyHex)
    secp256k1 的內部驗證需要 Uint8Array，因此需還原

-   secp.verify(signature, msgHash, publicKey, { prehash: false })
    呼叫 secp.verify 驗證簽名是否合法

###### 驗證流程

1. 檢查 r, s 是否在合法範圍內
2. 計算$w = s^{-1} \bmod n$
   把簽名時的 s 消除，讓驗證者能重建出 kG，進而檢查 r 是否相符。
3. 計算兩個 scalar
   $u_1 = z \cdot w \pmod{n}$
   $u_2 = r \cdot w \pmod{n}$
   透過這兩個係數，驗證者可以用 $G$ 和公鑰 $Q$ 組合出與簽名時同一個點 $kG$。
4. 用橢圓曲線點運算組合公鑰
   $P = u_1G + u_2Q$
   若簽名正確，則此點理論上應該等於簽名時的 $R = kG$。
5. 取 $P$ 的 x 座標 $x_P$，計算驗證結果
   $v = x_P \bmod n$
   如果 $v = r$，則簽名有效；否則簽名無效。

---

##### 補充說明

##### 點倍加公式的數學來源

本文件中所使用的橢圓曲線點倍加（point doubling）公式，
在實際的區塊鏈與 ECDSA 實作中皆以已整理好的代數封閉形式直接計算，
不涉及解多項式或使用偉達定理進行任何運算。

然而，在數學層面上，點倍加公式可由代數幾何的觀點加以解釋，
其來源可追溯至切線與橢圓曲線交點所對應之三次多項式，
並可透過偉達定理（Vieta’s formulas）說明其結構。

考慮橢圓曲線 $y^2 = x^3 + ax + b$。

取曲線上一點 $P = (x_1, y_1)$，並在該點作切線，其方程為  
$y = \lambda(x - x_1) + y_1$，

其中切線斜率為  
$\lambda = (3x_1^2 + a) / (2y_1)$。

將切線方程代回橢圓曲線方程後，可得一個關於 $x$ 的三次多項式。
由於切線在 $P$ 處與曲線相切，$x = x_1$ 為該多項式的重根，
設第三個交點之 $x$ 座標為 $x_3$。

依偉達定理，三次多項式三個根之和等於二次項係數，
因此有 $x_1 + x_1 + x_3 = \lambda^2$，

可得 $x_3 = \lambda^2 - 2x_1$。

此結果即為橢圓曲線點倍加公式中，新點 $x$ 座標的理論來源。
實際的點倍加結果定義為該第三交點對 $x$ 軸取對稱之點。

上述推導僅作為橢圓曲線群法則的數學解釋與背景補充，
實作層的簽名與驗證流程皆直接使用點倍加的封閉公式，
並不使用偉達定理作為計算步驟。

-   使用簡單數字運算橢圓曲線點倍加公式中，新點 $x$ 座標的理論來源
    ![推導](/pic/Sign-veritfy%20-2.jpg)
    ![推導](/pic/Sign-veritfy%20-3.jpg)
