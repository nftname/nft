# 🏛️ The Warehouse - مركز البيانات الموحد

## المفهوم (Single Source of Truth)

بدلاً من قراءة البيانات مباشرة من العقود في كل صفحة، **The Warehouse** يوفر مصدراً مركزياً موحداً لجميع بيانات الأصول عبر Custom Hooks.

## الهيكل المعماري

```
┌─────────────────────────────────────────────────┐
│          The Warehouse (useNNMAssetData)       │
│         Single Source of Truth for Data        │
└───────────────┬─────────────────────────────────┘
                │
    ┌───────────┼───────────┐
    │           │           │
    ▼           ▼           ▼
Marketplace  Dashboard   Search
```

## الـ Hooks المتاحة

### 1. `useNNMAssetData(tokenId)`
**الوظيفة:** جلب بيانات أصل معين
**المخرجات:**
```typescript
{
  tokenId: bigint;
  name: string;              // الاسم المستخرج من tokenURI
  tier: string;              // immortal | elite | founders
  owner?: string;            // عنوان المالك
  tokenURI?: string;         // رابط الـ metadata
  displayName: string;       // الاسم المُعَد للعرض
  tierColor: string;         // اللون الخاص بالرتبة (#FCD535)
  tierGradient: string;      // التدرج اللوني
  rank: number;              // الترتيب
}
```

**مثال:**
```tsx
const assetData = useNNMAssetData(BigInt(42));
if (assetData) {
  console.log(assetData.name);     // "bitcoin"
  console.log(assetData.tier);     // "immortal"
  console.log(assetData.tierColor); // "#FCD535"
}
```

### 2. `useNNMAllAssets()`
**الوظيفة:** جلب جميع الـ token IDs من Registry
**المخرجات:**
```typescript
{
  tokenIds: bigint[];        // قائمة بجميع الـ IDs (الأحدث أولاً)
  totalCount: number;        // إجمالي العدد
}
```

**مثال:**
```tsx
const { tokenIds } = useNNMAllAssets();
// [999n, 998n, 997n, ..., 2n, 1n, 0n]
```

### 3. `useNNMUserAssets(address)`
**الوظيفة:** جلب أصول مستخدم معين
**المخرجات:**
```typescript
{
  balance: number;           // عدد الأصول التي يملكها
}
```

**مثال:**
```tsx
const { balance } = useNNMUserAssets("0x123...");
console.log(`User owns ${balance} assets`);
```

### 4. `useNNMAssetAvailability(name)`
**الوظيفة:** التحقق من توفر اسم للطباعة
**المخرجات:**
```typescript
{
  isAvailable: boolean;      // هل الاسم متاح؟
  isReserved: boolean;       // هل محجوز؟
  canMint: boolean;          // هل يمكن طباعته؟
}
```

**مثال:**
```tsx
const { canMint } = useNNMAssetAvailability("bitcoin");
if (canMint) {
  // عرض زر "Mint"
}
```

## استخدام The Warehouse في صفحات المشروع

### ✅ Marketplace Page (تم التطبيق)
```tsx
import { useNNMAllAssets, useNNMAssetData } from "~~/hooks/scaffold-eth";

function Marketplace() {
  const { tokenIds } = useNNMAllAssets();
  
  return tokenIds.map(tokenId => (
    <AssetRow key={tokenId.toString()} tokenId={tokenId} />
  ));
}

function AssetRow({ tokenId }) {
  const assetData = useNNMAssetData(tokenId);
  
  return (
    <div style={{ background: assetData.tierGradient }}>
      <h3>{assetData.displayName}</h3>
      <span style={{ color: assetData.tierColor }}>
        {assetData.tier.toUpperCase()}
      </span>
    </div>
  );
}
```

### 🔜 Dashboard Page (قريباً)
```tsx
import { useNNMUserAssets } from "~~/hooks/scaffold-eth";
import { useAccount } from "wagmi";

function Dashboard() {
  const { address } = useAccount();
  const { balance } = useNNMUserAssets(address);
  
  return <h2>You own {balance} NFTs</h2>;
}
```

### 🔜 Search/Mint Page (قريباً)
```tsx
import { useNNMAssetAvailability } from "~~/hooks/scaffold-eth";

function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const { canMint, isReserved } = useNNMAssetAvailability(searchTerm);
  
  return (
    <>
      <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      {canMint && <button>Mint Now</button>}
      {isReserved && <p>Reserved</p>}
    </>
  );
}
```

## المزايا (Benefits)

✅ **مصدر موحد:** كل البيانات من مكان واحد  
✅ **سهولة الصيانة:** تعديل واحد يطبق على كل الصفحات  
✅ **تناسق التصميم:** نفس الألوان والأسماء في كل مكان  
✅ **أداء محسّن:** React Query تخزين مؤقت تلقائي  
✅ **Zero-Liability:** فصل بين البيانات الثابتة (Registry) والديناميكية (Marketplace)

## Zero-Liability Architecture

```
┌────────────────────────────────────────────────────────┐
│  Local Data (Static)         │  Contract Data (Dynamic)│
│  ─────────────────────       │  ───────────────────── │
│  • Names                     │  • isListed             │
│  • Tiers                     │  • Listing Price        │
│  • Colors                    │  • Offers               │
│  • Metadata                  │  • Sales History        │
│                              │                         │
│  ← The Warehouse             │  ← Marketplace Pipe →   │
└────────────────────────────────────────────────────────┘
```

## الخطوات التالية (Roadmap)

- [ ] تحسين استخراج الاسم من metadata JSON
- [ ] إضافة دعم للصور (image URLs)
- [ ] تطبيق في Dashboard page
- [ ] تطبيق في Search/Mint page
- [ ] إضافة نظام ترتيب (ranking) ديناميكي
- [ ] دعم فلترة وبحث محلي

---

**تم البناء بواسطة:** Zero-Liability Architecture  
**الملف المصدري:** `/packages/nextjs/hooks/scaffold-eth/useNNMAssetData.ts`
