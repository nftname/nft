# 🏗️ NNM NFT Marketplace - دليل تقني شامل

## 📋 جدول المحتويات

1. [نظرة عامة](#-نظرة-عامة)
2. [البنية المعمارية](#-البنية-المعمارية)
3. [تدفق عملية Mint](#-تدفق-عملية-mint)
4. [خريطة المشروع التفصيلية](#️-خريطة-المشروع-التفصيلية)
5. [أماكن التعديل الصحيحة](#-أماكن-التعديل-الصحيحة)
6. [الأخطاء والحلول](#-الأخطاء-والحلول)
7. [دليل الإصلاح السريع](#-دليل-الإصلاح-السريع)
8. [دليل التطوير](#️-دليل-التطوير)

---

## 🎯 نظرة عامة

### ما هو هذا المشروع؟

**NNM NFT Marketplace** هو منصة Web3 لسك (minting) وتداول NFTs مبنية على:
- **Blockchain:** Polygon Mainnet
- **Framework:** Next.js 15 + Scaffold-ETH 2
- **Smart Contract:** ERC721 (NNMRegistryV9)
- **Storage:** IPFS via Pinata

### الميزات الرئيسية:

✅ سك NFTs مع أسماء مخصصة  
✅ 3 مستويات (Tiers): IMMORTAL, ELITE, FOUNDER  
✅ تسعير ديناميكي بالدولار (يُحول تلقائياً لـ POL)  
✅ تخزين لامركزي على IPFS  
✅ Royalties 5% للمالك  
✅ نظام Authorized Minters  
✅ Pausable & Ownable  

---

## 🏛️ البنية المعمارية

### Architecture Diagram (نصي)

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER (Browser)                             │
│                     ↓                        ↑                      │
│                  Request                  Response                  │
└─────────────────────────────────────────────────────────────────────┘
                          ↓                        ↑
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js App)                           │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  React Components (pages)                                  │    │
│  │  • page.tsx         - Homepage                             │    │
│  │  • mint/page.tsx    - Minting interface                    │    │
│  │  • marketplace/     - Browse NFTs                          │    │
│  │  • dashboard/       - User's NFTs                          │    │
│  └────────────────────────────────────────────────────────────┘    │
│                          ↓                        ↑                 │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Scaffold-ETH Hooks Layer                                  │    │
│  │  • useScaffoldWriteContract  - Write to blockchain         │    │
│  │  • useScaffoldReadContract   - Read from blockchain        │    │
│  │  • useDeployedContractInfo   - Contract metadata           │    │
│  └────────────────────────────────────────────────────────────┘    │
│                          ↓                        ↑                 │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  wagmi + viem (Web3 Library)                               │    │
│  │  • useWriteContract  - Send transactions                   │    │
│  │  • useReadContract   - Call view functions                 │    │
│  │  • useAccount        - Wallet connection                   │    │
│  └────────────────────────────────────────────────────────────┘    │
│                          ↓                        ↑                 │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Contract Configuration                                     │    │
│  │  deployedContracts.ts - ABI + Address + Chain ID           │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                          ↓                        ↑
┌─────────────────────────────────────────────────────────────────────┐
│                    API Routes (Backend)                             │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  /api/mint/route.ts                                        │    │
│  │  • Generate SVG image                                      │    │
│  │  • Upload image to Pinata IPFS                             │    │
│  │  • Create metadata JSON                                    │    │
│  │  • Upload metadata to IPFS                                 │    │
│  │  • Return tokenURI                                         │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                          ↓                        ↑
┌─────────────────────────────────────────────────────────────────────┐
│                      IPFS (Pinata)                                  │
│  Storage for:                                                       │
│  • NFT Images (SVG)                                                 │
│  • Metadata JSON files                                              │
└─────────────────────────────────────────────────────────────────────┘
                          ↓                        ↑
┌─────────────────────────────────────────────────────────────────────┐
│                  RPC Provider (Polygon)                             │
│  • Alchemy RPC                                                      │
│  • Public Polygon RPC (fallback)                                    │
└─────────────────────────────────────────────────────────────────────┘
                          ↓                        ↑
┌─────────────────────────────────────────────────────────────────────┐
│               BLOCKCHAIN (Polygon Mainnet)                          │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Smart Contract: NNMRegistryV9                             │    │
│  │  Address: 0xBCb1db4D779287a21c250Dde5e28C746fC143812       │    │
│  │  Chain ID: 137                                              │    │
│  │                                                             │    │
│  │  Key Functions:                                             │    │
│  │  • mintPublic(name, tier, tokenURI) payable                │    │
│  │  • authorizedMint(name, tier, tokenURI)                    │    │
│  │  • balanceOf(address) → uint256                            │    │
│  │  • tokenURI(tokenId) → string                              │    │
│  │  • getMaticCost(usdAmount) → uint256                       │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                          ↓                        ↑
┌─────────────────────────────────────────────────────────────────────┐
│                 Chainlink Price Oracle                              │
│  MATIC/USD Price Feed                                               │
│  Address: 0xAB594600376Ec9fD91F8e885dADF0CE036862dE0                │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
User Clicks "Mint NFT"
         ↓
    mint/page.tsx
         ↓
    handleMint()
         ↓
    ┌──────────────────┐
    │  Step 1: API     │
    │  Upload to IPFS  │
    └──────────────────┘
         ↓
    POST /api/mint
         ↓
    route.ts processes:
    • Generate SVG
    • Upload image
    • Create metadata
    • Upload metadata
         ↓
    Returns tokenURI
         ↓
    ┌──────────────────┐
    │  Step 2: Write   │
    │  to Blockchain   │
    └──────────────────┘
         ↓
    writeContractAsync({
      contractName: "NNMMarket",
      functionName: "mintPublic",
      args: [name, tier, tokenURI],
      value: cost
    })
         ↓
    useScaffoldWriteContract
         ↓
    wagmi.useWriteContract
         ↓
    viem sends transaction
         ↓
    RPC forwards to Polygon
         ↓
    Smart Contract executes:
    • Validates name
    • Checks payment
    • Mints NFT
    • Sets tokenURI
    • Emits NameMinted event
         ↓
    Transaction confirmed
         ↓
    Frontend shows success
         ↓
    NFT visible in wallet
```

---

## 🔄 تدفق عملية Mint

### خطوة بخطوة (Complete Flow)

#### **Phase 1: User Interaction**

```typescript
// 1. المستخدم يفتح /mint
// 2. يصل المحفظة (RainbowKit)
// 3. يتحقق من الشبكة (Polygon؟)
if (chainId !== polygon.id) {
  await switchChain({ chainId: polygon.id });
}

// 4. يدخل اسم NFT
<input 
  value={name} 
  onChange={e => setName(e.target.value)}
  maxLength={50}
/>

// 5. يشاهد السعر
const { data: mintPrice } = useScaffoldReadContract({
  contractName: "NNMMarket",
  functionName: "getMaticCost",
  args: [parseEther("10")] // FOUNDER tier
});
```

#### **Phase 2: IPFS Upload**

```typescript
// 6. المستخدم يضغط "Mint NFT"
// 7. Frontend يرسل request للـ API

const response = await fetch("/api/mint", {
  method: "POST",
  body: JSON.stringify({ name: name.trim() })
});

// 8. API يولّد صورة SVG
const svgImage = `
  <svg width="500" height="500">
    <rect fill="#6366f1"/>
    <text>${name}</text>
    <text>NNM Market NFT</text>
  </svg>
`;

// 9. رفع الصورة لـ Pinata
const imageUpload = await fetch(
  "https://api.pinata.cloud/pinning/pinFileToIPFS",
  {
    method: "POST",
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: imageFormData
  }
);
// → Response: { IpfsHash: "Qm..." }

// 10. بناء metadata
const metadata = {
  name: "MyNFT",
  description: "MyNFT - NNM Market NFT",
  image: `${GATEWAY_URL}/ipfs/${imageHash}`,
  attributes: [
    { trait_type: "Name", value: "MyNFT" },
    { trait_type: "Marketplace", value: "NNM Market" },
    { trait_type: "Minted Date", value: "2025-12-20..." }
  ]
};

// 11. رفع metadata لـ Pinata
const metadataUpload = await fetch(
  "https://api.pinata.cloud/pinning/pinJSONToIPFS",
  {
    method: "POST",
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: JSON.stringify({ pinataContent: metadata })
  }
);
// → Response: { IpfsHash: "Qm..." }

// 12. إرجاع tokenURI
const tokenURI = `${GATEWAY_URL}/ipfs/${metadataHash}`;
return { tokenURI };
```

#### **Phase 3: Blockchain Transaction**

```typescript
// 13. Frontend يستقبل tokenURI
const { tokenURI } = await response.json();

// 14. حساب التكلفة
const cost = await readContract({
  address: contractAddress,
  abi: contractAbi,
  functionName: "getMaticCost",
  args: [parseEther("10")] // $10 USD for FOUNDER
});

// 15. إرسال معاملة
await writeContractAsync({
  functionName: "mintPublic",
  args: [
    name.trim(),      // _name: string
    2,                // _tier: Tier.FOUNDER (enum value)
    tokenURI          // _tokenURI: string
  ],
  value: cost         // msg.value في wei
});

// 16. wagmi تُرسل المعاملة عبر viem
// 17. المحفظة تطلب موافقة المستخدم
// 18. المستخدم يوافق + يدفع Gas
// 19. المعاملة تُرسل للـ RPC
// 20. RPC يُرسلها للـ blockchain
```

#### **Phase 4: Smart Contract Execution**

```solidity
// 21. mintPublic() يتم استدعاؤها
function mintPublic(
    string memory _name,
    Tier _tier,
    string memory _tokenURI
) external payable nonReentrant whenNotPaused {
    // 22. حساب السعر بـ POL
    uint256 usdPrice = priceFounder; // 10 * 1e18 ($10)
    uint256 cost = getMaticCost(usdPrice);
    
    // 23. التحقق من الدفعة
    require(msg.value >= cost, "Insufficient POL");
    
    // 24. تنظيف الاسم
    string memory cleanName = _validateAndFormatName(_name);
    // • الطول: 2-40 حرف
    // • الأحرف: A-Z, 0-9 فقط
    // • تحويل للـ uppercase
    
    // 25. تنفيذ mint
    _mintLogic(cleanName, _tier, msg.sender, _tokenURI);
    
    // 26. إرجاع الفائض
    if (msg.value > cost) {
        (bool success, ) = msg.sender.call{value: msg.value - cost}("");
        require(success, "Refund failed");
    }
}

// 27. _mintLogic يتم تنفيذها
function _mintLogic(
    string memory _name,
    Tier _tier,
    address _to,
    string memory _tokenURI
) internal {
    // 28. التحقق من عدم تكرار الاسم
    bytes32 nameHash = keccak256(abi.encodePacked(_name));
    require(!registeredNames[nameHash], "Name already taken");
    
    // 29. توليد tokenId جديد
    _tokenIds++;
    uint256 tokenId = _tokenIds;
    
    // 30. حفظ البيانات
    registeredNames[nameHash] = true;
    nameRecords[tokenId] = NameData(_name, _tier, block.timestamp);
    
    // 31. سك NFT
    _safeMint(_to, tokenId);
    
    // 32. ربط tokenURI
    _setTokenURI(tokenId, _tokenURI);
    
    // 33. إطلاق event
    emit NameMinted(tokenId, _name, _tier, _to, block.timestamp);
}
```

#### **Phase 5: Confirmation & Display**

```typescript
// 34. المعاملة تُؤكد على البلوكشين
// 35. wagmi تكتشف التأكيد
// 36. Frontend يعرض رسالة نجاح

setStatus("Success! Your NFT has been minted. 🎉");

// 37. NFT يظهر في:
// • محفظة المستخدم (MetaMask)
// • PolygonScan
// • Dashboard الخاص بالموقع

// 38. MetaMask تجلب البيانات:
const uri = await contract.tokenURI(tokenId);
const metadata = await fetch(uri).then(r => r.json());
// → يعرض الصورة من metadata.image
```

### التوقيت المتوقع

| الخطوة | الوقت |
|--------|-------|
| IPFS Upload (صورة + metadata) | 2-5 ثواني |
| موافقة المستخدم على المعاملة | يعتمد على المستخدم |
| تنفيذ المعاملة على Polygon | 2-10 ثواني |
| **المجموع** | **~5-20 ثانية** |

---

## 🗺️ خريطة المشروع التفصيلية

### المجلدات الرئيسية

```
/workspaces/nft/
│
├── 📦 packages/
│   │
│   ├── 🔨 hardhat/                    [Smart Contract Development]
│   │   │
│   │   ├── 📄 contracts/
│   │   │   └── YourContract.sol       ← العقد الذكي الفعلي
│   │   │       • contract NNMRegistryV9
│   │   │       • ERC721 + Enumerable + URIStorage
│   │   │       • Pausable + Ownable + ReentrancyGuard
│   │   │       • ERC2981 Royalties
│   │   │       • Chainlink Price Oracle integration
│   │   │
│   │   ├── 📄 deploy/
│   │   │   └── 00_deploy_your_contract.ts
│   │   │       • Hardhat deploy script
│   │   │       • ينشر العقد على الشبكة المحددة
│   │   │
│   │   ├── 📁 deployments/
│   │   │   └── polygon/
│   │   │       ├── YourContract.json  ← ABI + Address + Receipt
│   │   │       │   • address: "0xBCb1db4D779287a21c250Dde5e28C746fC143812"
│   │   │       │   • transactionHash: "0x65cb1b..."
│   │   │       │   • abi: [...]
│   │   │       └── solcInputs/
│   │   │
│   │   ├── 📄 test/
│   │   │   └── YourContract.ts        ← Unit tests (لم يتم تحديثها)
│   │   │
│   │   ├── ⚙️ hardhat.config.ts
│   │   │   • networks: { polygon: {...} }
│   │   │   • solidity: "0.8.24"
│   │   │
│   │   └── 📦 package.json
│   │       • hardhat
│   │       • @openzeppelin/contracts
│   │       • @chainlink/contracts
│   │
│   └── 🌐 nextjs/                     [Frontend Application]
│       │
│       ├── 📱 app/                     [Next.js 15 App Router]
│       │   │
│       │   ├── 🏠 page.tsx
│       │   │   • الصفحة الرئيسية
│       │   │   • Welcome screen
│       │   │   • روابط سريعة
│       │   │
│       │   ├── 📐 layout.tsx
│       │   │   • Root layout
│       │   │   • يحتوي على Header + Footer
│       │   │   • ScaffoldEthAppWithProviders wrapper
│       │   │
│       │   ├── 🎨 mint/
│       │   │   └── page.tsx           ⚠️ يستخدم "NNMMarket"
│       │   │       • واجهة سك NFTs
│       │   │       • إدخال الاسم
│       │   │       • رفع لـ IPFS
│       │   │       • استدعاء mintPublic()
│       │   │       • عرض السعر والحالة
│       │   │
│       │   ├── 🏪 marketplace/
│       │   │   └── page.tsx           ⚠️ يستخدم "NNMMarket"
│       │   │       • عرض جميع NFTs
│       │   │       • إحصائيات (total supply, mint price)
│       │   │       • Grid view للـ NFTs
│       │   │       • ⚠️ حالياً يستخدم mock data
│       │   │
│       │   ├── 📊 dashboard/
│       │   │   └── page.tsx           ⚠️ يستخدم "NNMMarket"
│       │   │       • NFTs المملوكة للمستخدم
│       │   │       • زر Withdraw (للمالك فقط)
│       │   │       • رصيد العقد
│       │   │       • ⚠️ حالياً يستخدم mock data
│       │   │
│       │   └── 📡 api/
│       │       └── mint/
│       │           └── route.ts       ✅ يعمل بشكل صحيح
│       │               • POST handler
│       │               • توليد صورة SVG
│       │               • رفع لـ Pinata IPFS
│       │               • إنشاء metadata JSON
│       │               • إرجاع tokenURI
│       │
│       ├── 🧩 components/
│       │   ├── Header.tsx             • القائمة العلوية
│       │   ├── Footer.tsx             • Footer
│       │   ├── ThemeProvider.tsx      • Dark/Light mode
│       │   └── scaffold-eth/
│       │       ├── RainbowKitCustomConnectButton/
│       │       ├── FaucetButton.tsx
│       │       └── BlockieAvatar.tsx
│       │
│       ├── 📜 contracts/
│       │   ├── deployedContracts.ts   ❌ KEY ISSUE
│       │   │   • يحتوي على ABI + Address
│       │   │   • المفتاح: "YourContract" ← يجب تغييره
│       │   │   • يجب أن يكون: "NNMMarket"
│       │   │   • Address: 0xBCb1db4D779287a21c250Dde5e28C746fC143812
│       │   │   • Chain: 137 (Polygon)
│       │   │
│       │   └── externalContracts.ts   • عقود خارجية (فارغ)
│       │
│       ├── 🎣 hooks/
│       │   └── scaffold-eth/
│       │       ├── useScaffoldWriteContract.ts
│       │       │   • wrapper حول wagmi.useWriteContract
│       │       │   • يوفر type-safety
│       │       │   • يستخدم deployedContracts.ts
│       │       │
│       │       ├── useScaffoldReadContract.ts
│       │       │   • wrapper حول wagmi.useReadContract
│       │       │   • للقراءة من العقد
│       │       │
│       │       ├── useDeployedContractInfo.ts
│       │       │   • يجلب معلومات العقد (address, abi)
│       │       │
│       │       └── index.ts           • يصدّر جميع الـ hooks
│       │
│       ├── 🛠️ utils/
│       │   └── scaffold-eth/
│       │       ├── contract.ts
│       │       │   • TypeScript type definitions
│       │       │   • ContractName, ContractAbi, etc.
│       │       │   • يستورد deployedContracts
│       │       │
│       │       ├── contractsData.ts
│       │       │   • useAllContracts hook
│       │       │
│       │       └── networks.ts        • تعريفات الشبكات
│       │
│       ├── 🎨 styles/
│       │   └── globals.css            • Tailwind styles
│       │
│       ├── ⚙️ scaffold.config.ts      ✅ صحيح
│       │   • targetNetworks: [polygon]
│       │   • pollingInterval: 30000
│       │   • rpcOverrides: { 137: "https://polygon-rpc.com" }
│       │
│       ├── ⚙️ next.config.ts
│       │   • Next.js configuration
│       │
│       ├── 🔐 .env.local              ✅ موجود
│       │   • NEXT_PUBLIC_ALCHEMY_API_KEY
│       │   • NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
│       │   • PINATA_JWT
│       │   • NEXT_PUBLIC_GATEWAY_URL
│       │
│       └── 📦 package.json
│           • next: ^15.2.8
│           • react: ^19.2.3
│           • wagmi: 2.19.5
│           • viem: 2.39.0
│           • @rainbow-me/rainbowkit: 2.2.9
│
├── 📖 README.md                       • README الأصلي من Scaffold-ETH
├── 📖 SETUP_COMPLETE.md               • دليل الإعداد
├── 📖 PROJECT_MAP.md                  • خريطة المشروع
├── 🔍 AUDIT_REPORT.md                 • تقرير التدقيق (هذا الملف)
├── 📖 TECHNICAL_README.md             • هذا الدليل التقني
│
└── 📦 package.json                    • Yarn workspaces root
    • workspaces: ["packages/hardhat", "packages/nextjs"]
```

---

## 📍 أماكن التعديل الصحيحة

### 1. تعديل اسم العقد (Contract Name)

#### **ملف واحد فقط:**

```typescript
// 📁 packages/nextjs/contracts/deployedContracts.ts

// ❌ BEFORE:
const deployedContracts = {
  137: {
    YourContract: {  // ← خطأ
      address: "0xBCb1db4D779287a21c250Dde5e28C746fC143812",
      abi: [...]
    }
  }
}

// ✅ AFTER:
const deployedContracts = {
  137: {
    NNMMarket: {  // ← صحيح
      address: "0xBCb1db4D779287a21c250Dde5e28C746fC143812",
      abi: [...]  // نفس الـ ABI، لا تغيير
    }
  }
} as const satisfies GenericContractsDeclaration;
```

### 2. إضافة Value للـ Mint Transaction

#### **ملف:**

```typescript
// 📁 packages/nextjs/app/mint/page.tsx

// ❌ BEFORE:
await writeContractAsync({
  functionName: "mintPublic",
  args: [name.trim(), 2, uploadedTokenURI],
  // value مفقود!
});

// ✅ AFTER:
// أولاً: احسب التكلفة
const { data: mintCost } = useScaffoldReadContract({
  contractName: "NNMMarket",
  functionName: "getMaticCost",
  args: [parseEther("10")],  // FOUNDER tier = $10 USD
});

// ثانياً: أرسلها مع المعاملة
await writeContractAsync({
  functionName: "mintPublic",
  args: [name.trim(), 2, uploadedTokenURI],
  value: mintCost,  // ✅ أضف هنا
});
```

### 3. إصلاح عرض السعر

#### **ملفات متعددة:**

```typescript
// 📁 packages/nextjs/app/mint/page.tsx
// 📁 packages/nextjs/app/marketplace/page.tsx

// ❌ BEFORE:
const { data: mintPrice } = useScaffoldReadContract({
  contractName: "NNMMarket",
  functionName: "mintPrice",  // ← لا توجد هذه الدالة!
});

// ✅ AFTER - Option 1 (عرض السعر بالدولار):
const { data: priceUSD } = useScaffoldReadContract({
  contractName: "NNMMarket",
  functionName: "priceFounder",  // → 10 * 1e18 ($10)
});

// ✅ AFTER - Option 2 (عرض السعر بـ POL):
const { data: pricePOL } = useScaffoldReadContract({
  contractName: "NNMMarket",
  functionName: "getMaticCost",
  args: [parseEther("10")],  // تحويل $10 لـ POL
});

// عرض:
<p>Price: {formatEther(pricePOL || 0n)} POL</p>
```

### 4. تحسين Marketplace (اختياري)

#### **ملف:**

```typescript
// 📁 packages/nextjs/app/marketplace/page.tsx

// ✅ استخدم البيانات الفعلية بدلاً من mock:

// 1. احصل على tokenId الفعلي
const { data: tokenId } = useScaffoldReadContract({
  contractName: "NNMMarket",
  functionName: "tokenByIndex",
  args: [BigInt(index)],
});

// 2. احصل على tokenURI
const { data: uri } = useScaffoldReadContract({
  contractName: "NNMMarket",
  functionName: "tokenURI",
  args: [tokenId],
});

// 3. اجلب metadata من IPFS
const [metadata, setMetadata] = useState<NFTMetadata | null>(null);

useEffect(() => {
  if (uri) {
    fetch(uri)
      .then(r => r.json())
      .then(data => setMetadata(data));
  }
}, [uri]);

// 4. اعرض الصورة الفعلية
{metadata && (
  <img src={metadata.image} alt={metadata.name} />
)}
```

### 5. تحسين Dashboard (اختياري)

#### **ملف:**

```typescript
// 📁 packages/nextjs/app/dashboard/page.tsx

// ✅ استخدم tokenOfOwnerByIndex:

const { data: balance } = useScaffoldReadContract({
  contractName: "NNMMarket",
  functionName: "balanceOf",
  args: [connectedAddress],
});

// لكل NFT مملوك:
for (let i = 0; i < Number(balance); i++) {
  const { data: tokenId } = useScaffoldReadContract({
    contractName: "NNMMarket",
    functionName: "tokenOfOwnerByIndex",
    args: [connectedAddress, BigInt(i)],
  });
  
  const { data: uri } = useScaffoldReadContract({
    contractName: "NNMMarket",
    functionName: "tokenURI",
    args: [tokenId],
  });
  
  // اجلب metadata...
}
```

---

## ⚠️ الأخطاء والحلول

### الخطأ الحرج (يجب إصلاحه فوراً)

#### **❌ Contract Name Mismatch**

**الوصف:**
```
Frontend يبحث عن: "NNMMarket"
deployedContracts.ts يحتوي على: "YourContract"
النتيجة: Contract not found → جميع العمليات تفشل
```

**الحل:**
```typescript
// في deployedContracts.ts، غير:
YourContract: { ... }
// إلى:
NNMMarket: { ... }
```

**التأثير:**
- 🔴 يمنع جميع عمليات mint
- 🔴 يمنع قراءة البيانات من العقد
- 🔴 يعطل Marketplace و Dashboard بالكامل

**الأولوية:** ⚡ فوري - يجب إصلاحه قبل أي شيء آخر

---

### أخطاء ثانوية (يُنصح بإصلاحها)

#### **⚠️ 1. Missing Value in Mint**

**الوصف:**
```typescript
// المعاملة تُرسل بدون value
await writeContractAsync({
  functionName: "mintPublic",
  args: [name, tier, tokenURI],
  // value مفقود!
});

// العقد يتوقع:
function mintPublic(...) external payable {
  require(msg.value >= cost);  // ← سيفشل دائماً!
}
```

**الحل:**
```typescript
const cost = await readContract({
  functionName: "getMaticCost",
  args: [parseEther("10")]
});

await writeContractAsync({
  functionName: "mintPublic",
  args: [name, tier, tokenURI],
  value: cost  // ✅
});
```

---

#### **⚠️ 2. Wrong Function Name (mintPrice)**

**الوصف:**
```typescript
// يحاول قراءة دالة غير موجودة
const { data } = useScaffoldReadContract({
  functionName: "mintPrice"  // ← لا توجد!
});
```

**الحل:**
```typescript
// استخدم الدالة الصحيحة:
const { data } = useScaffoldReadContract({
  functionName: "priceFounder"  // أو priceElite، priceImmortal
});

// أو:
const { data } = useScaffoldReadContract({
  functionName: "getMaticCost",
  args: [parseEther("10")]
});
```

---

#### **ℹ️ 3. Mock Data في Marketplace**

**الوصف:**
```typescript
// يستخدم بيانات وهمية
return {
  tokenId,
  owner: "0x...",
  tokenURI: `https://example.com/token/${tokenId}`,
  metadata: {
    image: `https://via.placeholder.com/300`
  }
};
```

**الحل:**
```typescript
// استخدم العقد الفعلي
const tokenId = await readContract({
  functionName: "tokenByIndex",
  args: [index]
});

const uri = await readContract({
  functionName: "tokenURI",
  args: [tokenId]
});

const metadata = await fetch(uri).then(r => r.json());
```

---

## 🚀 دليل الإصلاح السريع

### الخطوات الواجب تنفيذها (بالترتيب)

#### **✅ الخطوة 1: إصلاح Contract Name**

```bash
# 1. افتح الملف
code packages/nextjs/contracts/deployedContracts.ts

# 2. ابحث عن (Ctrl+F):
YourContract: {

# 3. استبدله بـ:
NNMMarket: {

# 4. احفظ الملف (Ctrl+S)
```

#### **✅ الخطوة 2: إصلاح Mint Value**

```bash
# 1. افتح الملف
code packages/nextjs/app/mint/page.tsx

# 2. ابحث عن:
const { data: mintPrice } = useScaffoldReadContract

# 3. استبدله بـ:
const { data: mintCost } = useScaffoldReadContract({
  contractName: "NNMMarket",
  functionName: "getMaticCost",
  args: [parseEther("10")],
});

# 4. ابحث عن:
await writeContractAsync({
  functionName: "mintPublic",
  args: [name.trim(), 2, uploadedTokenURI],
});

# 5. استبدله بـ:
await writeContractAsync({
  functionName: "mintPublic",
  args: [name.trim(), 2, uploadedTokenURI],
  value: mintCost,
});

# 6. احفظ
```

#### **✅ الخطوة 3: اختبار**

```bash
# 1. شغل المشروع
cd packages/nextjs
yarn start

# 2. افتح http://localhost:3000

# 3. صل المحفظة

# 4. اذهب إلى /mint

# 5. جرب mint NFT

# 6. تحقق من:
# - ظهور السعر بـ POL ✓
# - طلب موافقة من MetaMask ✓
# - نجاح المعاملة ✓
# - ظهور NFT في المحفظة ✓
```

---

## 🛠️ دليل التطوير

### إضافة ميزات جديدة

#### **1. إضافة صفحة جديدة**

```bash
# 1. أنشئ الملف
packages/nextjs/app/my-page/page.tsx

# 2. أضف المحتوى:
```

```typescript
"use client";

export default function MyPage() {
  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <h1>My New Page</h1>
    </div>
  );
}
```

```bash
# 3. أضفها للـ Header:
packages/nextjs/components/Header.tsx
```

```typescript
export const menuLinks: HeaderMenuLink[] = [
  // ... existing links
  {
    label: "My Page",
    href: "/my-page",
  },
];
```

#### **2. قراءة بيانات من العقد**

```typescript
const { data, isLoading, error } = useScaffoldReadContract({
  contractName: "NNMMarket",
  functionName: "functionName",
  args: [arg1, arg2],
});

// مثال:
const { data: totalSupply } = useScaffoldReadContract({
  contractName: "NNMMarket",
  functionName: "totalSupply",
});
```

#### **3. الكتابة على العقد**

```typescript
const { writeContractAsync } = useScaffoldWriteContract("NNMMarket");

const handleAction = async () => {
  try {
    await writeContractAsync({
      functionName: "functionName",
      args: [arg1, arg2],
      value: parseEther("0.1"),  // إذا كانت payable
    });
  } catch (error) {
    console.error(error);
  }
};
```

#### **4. الاستماع للـ Events**

```typescript
useScaffoldWatchContractEvent({
  contractName: "NNMMarket",
  eventName: "NameMinted",
  onLogs: (logs) => {
    logs.forEach((log) => {
      const { tokenId, name, tier, owner } = log.args;
      console.log(`NFT #${tokenId} minted: ${name}`);
    });
  },
});
```

---

### تعديل العقد الذكي

#### **1. تعديل العقد**

```bash
# 1. افتح العقد
packages/hardhat/contracts/YourContract.sol

# 2. عدّل الكود
# 3. احفظ
```

#### **2. إعادة compile**

```bash
cd packages/hardhat
yarn hardhat:compile
```

#### **3. إعادة deploy (على testnet أولاً!)**

```bash
# Polygon Mumbai Testnet
yarn hardhat:deploy --network mumbai

# Polygon Mainnet (كن حذراً!)
yarn hardhat:deploy --network polygon
```

#### **4. تحديث Frontend**

```bash
# الـ ABI يتحدث تلقائياً في:
packages/nextjs/contracts/deployedContracts.ts

# تأكد من تحديث:
# - address الجديد (إذا تغير)
# - abi الجديد (تلقائياً)
```

---

### إضافة API Route جديد

```typescript
// packages/nextjs/app/api/my-route/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "Hello" });
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  
  // Process data...
  
  return NextResponse.json({ success: true });
}
```

---

### نصائح التطوير

#### **1. استخدم TypeScript**
- جميع الـ types معرّفة في `contract.ts`
- استفد من autocomplete في VSCode

#### **2. استخدم Scaffold-ETH Hooks**
- لا تستخدم wagmi مباشرة
- استخدم `useScaffoldWriteContract` بدلاً من `useWriteContract`

#### **3. Handle Errors**
```typescript
try {
  await writeContractAsync({...});
} catch (error: any) {
  // تعامل مع الأخطاء بشكل صحيح
  toast.error(error.message);
}
```

#### **4. Test على Testnet أولاً**
- Mumbai Testnet للـ Polygon
- لا تختبر مباشرة على Mainnet!

---

## 🎓 موارد إضافية

### Documentation

- **Scaffold-ETH 2:** https://docs.scaffoldeth.io
- **wagmi:** https://wagmi.sh
- **viem:** https://viem.sh
- **Next.js:** https://nextjs.org/docs
- **Polygon:** https://docs.polygon.technology

### Smart Contract Resources

- **OpenZeppelin:** https://docs.openzeppelin.com/contracts
- **Solidity:** https://docs.soliditylang.org
- **Chainlink:** https://docs.chain.link

### Tools

- **PolygonScan:** https://polygonscan.com
- **Hardhat:** https://hardhat.org/docs
- **Pinata:** https://docs.pinata.cloud

---

## 📞 الخلاصة

### ✅ بعد تطبيق الإصلاحات:

1. ✅ Mint سيعمل بشكل صحيح
2. ✅ NFTs ستُسك على البلوكشين
3. ✅ الصور ستظهر في المحافظ
4. ✅ Marketplace سيعرض البيانات (بعد التحسين)
5. ✅ Dashboard سيعمل بشكل صحيح

### 🎯 Next Steps:

1. **إصلاح الأخطاء الحرجة** (Contract Name + Mint Value)
2. **اختبار على testnet** (Mumbai)
3. **تحسين Marketplace & Dashboard**
4. **إضافة ميزات إضافية** (Transfer, Burn, etc.)
5. **Optimize UX** (Loading states, Error messages)

---

**آخر تحديث:** 20 ديسمبر 2025  
**النسخة:** 1.0.0  
**الحالة:** 🔴 يتطلب إصلاحات حرجة

**🚀 Happy Coding!**
