async function fetchChain() {
    const res = await fetch("/chain")
    const data = await res.json()

    const container = document.getElementById("chainDisplay")
    if (!container) {
        return
    }
    container.innerHTML = "" // 清空

    data.forEach((block) => {
        const card = document.createElement("div")
        card.className = "block-card"

        card.innerHTML = `
            <div class="block-header">區塊 #${block.index}</div>
            <div class="block-field">
                <span class="block-label">Timestamp:</span> ${block.timestamp}
            </div>
            <div class="block-field"><span class="block-label">Data:</span>
                <div class="block-data">${block.data}</div>
            </div>
            <div class="block-field">
                <span class="block-label">Previous Hash:</span>
                <div class="block-hash">${block.previousHash}</div>
            </div>
            <div class="block-field">
                <span class="block-label">Nonce:</span> ${block.nonce}
            </div>
            <div class="block-field">
                <span class="block-label">Hash:</span>
                <div class="block-hash">${block.hash}</div>
            </div>
        `

        container.appendChild(card)
    })
}

async function mineWithData() {
    const input = document.getElementById("dataInput")
    if (!input) {
        return
    }
    const data = input.value || "Empty Data"

    await fetch("/add-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data })
    })

    input.value = ""
    fetchChain()
}

function initNavigation() {
    const sections = {
        view: document.getElementById("view-section"),
        fork: document.getElementById("fork-section"),
        about: document.getElementById("about-section")
    }

    const buttons = document.querySelectorAll(".nav-link")

    function setActive(target) {
        Object.values(sections).forEach((section) => {
            if (!section) {
                return
            }
            section.classList.toggle("active", section === sections[target])
        })

        buttons.forEach((btn) => {
            const isTarget = btn.dataset.section === target
            btn.classList.toggle("active", isTarget)
        })
    }

    buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const target = btn.dataset.section
            if (target && sections[target]) {
                setActive(target)
            }
        })
    })

    setActive("view")
}

// ---------- Wallet page ----------

async function createWalletFromServer() {
    const labelInput = document.getElementById("walletLabel")
    const networkSelect = document.getElementById("walletNetwork")
    const showPrivate = document.getElementById("showPrivate")

    const label = labelInput ? labelInput.value : ""
    const network = networkSelect ? networkSelect.value : "mainnet"
    const includePrivate = showPrivate && showPrivate.checked ? "1" : "0"

    const res = await fetch(`/wallet/new?includePrivate=${includePrivate}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, network })
    })
    const data = await res.json()

    const addressEl = document.getElementById("walletAddress")
    const pubEl = document.getElementById("walletPubKey")
    const privEl = document.getElementById("walletPrivKey")
    const privCard = document.getElementById("privateCard")

    if (addressEl) {
        addressEl.textContent = data.addressP2PKH ?? ""
    }
    if (pubEl) {
        pubEl.textContent = data.publicKeyCompressedHex ?? ""
    }

    if (privCard && privEl) {
        const priv = data.privateKeyHex
        if (priv) {
            privCard.style.display = "block"
            privEl.textContent = priv
        } else {
            privCard.style.display = "none"
            privEl.textContent = ""
        }
    }
}

function initWalletPage() {
    const btn = document.getElementById("createWallet")
    if (!btn) {
        return
    }
    btn.addEventListener("click", () => {
        createWalletFromServer()
    })
}

// ---------- Page routing ----------

function initBlockchainPage() {
    const mineBtn = document.getElementById("mineData")
    if (mineBtn) {
        mineBtn.onclick = mineWithData
    }

    // 只有 index.html 才有這些 section / nav
    const viewSection = document.getElementById("view-section")
    if (viewSection) {
        initNavigation()
    }

    fetchChain()
}

function initApp() {
    const page = document.body.dataset.page || "blockchain"
    if (page === "wallet") {
        initWalletPage()
        return
    }
    initBlockchainPage()
}

initApp()
