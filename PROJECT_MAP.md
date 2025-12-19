# مخطط بنية المشروع / Project Structure Map

## معلومات أساسية / Key Information

### 📦 المجلدات الرئيسية داخل packages / Main Folders in packages:
1. **hardhat** - مشروع Hardhat للعقود الذكية (Solidity contracts)
   - الموقع: `/workspaces/nft/packages/hardhat/`
   - يحتوي على: العقود الذكية، السكريبتات، الاختبارات

2. **nextjs** - تطبيق Next.js (Frontend application)  
   - الموقع: `/workspaces/nft/packages/nextjs/`
   - يحتوي على: التطبيق الأمامي بالكامل

### 📄 ملف package.json الخاص بـ Next.js:
**الموقع الدقيق:** `/workspaces/nft/packages/nextjs/package.json`
- يحتوي على: `"next": "^15.2.8"`
- **هذا هو المجلد الذي يجب تحديده كـ Root Directory في Vercel**

### ⚙️ إعدادات Vercel الموصى بها:
```
Framework Preset: Next.js
Root Directory: packages/nextjs
Build Command: yarn build (أو حسب package.json)
Output Directory: .next (افتراضي)
Install Command: yarn install
```

---

## الشجرة الكاملة للمشروع / Full Directory Tree
(تم استثناء node_modules و .git للوضوح)

```
.
├── .cursor
│   └── rules
│       └── scaffold-eth.mdc
├── .github
│   ├── ISSUE_TEMPLATE
│   │   ├── bug_report.yml
│   │   └── config.yml
│   ├── workflows
│   │   └── lint.yaml
│   └── pull_request_template.md
├── .husky
│   ├── _
│   │   ├── .gitignore
│   │   ├── applypatch-msg
│   │   ├── commit-msg
│   │   ├── h
│   │   ├── husky.sh
│   │   ├── post-applypatch
│   │   ├── post-checkout
│   │   ├── post-commit
│   │   ├── post-merge
│   │   ├── post-rewrite
│   │   ├── pre-applypatch
│   │   ├── pre-auto-gc
│   │   ├── pre-commit
│   │   ├── pre-merge-commit
│   │   ├── pre-push
│   │   ├── pre-rebase
│   │   └── prepare-commit-msg
│   └── pre-commit
├── .yarn
│   ├── cache
│   │   └── [محتويات الكاش]
│   ├── patches
│   │   └── [الباتشات]
│   ├── plugins
│   │   └── [الإضافات]
│   ├── releases
│   │   └── yarn-4.6.0.cjs
│   └── sdks
│       ├── eslint
│       │   ├── bin
│       │   │   └── eslint.js
│       │   ├── lib
│       │   │   ├── api.js
│       │   │   └── unsupported-api.js
│       │   └── package.json
│       ├── prettier
│       │   ├── bin
│       │   │   └── prettier.cjs
│       │   ├── index.cjs
│       │   ├── index.js
│       │   └── package.json
│       └── typescript
│           ├── bin
│           │   ├── tsc
│           │   └── tsserver
│           ├── lib
│           │   ├── [ملفات TypeScript]
│           │   └── typescript.js
│           └── package.json
├── packages
│   ├── hardhat
│   │   ├── contracts
│   │   │   └── YourContract.sol
│   │   ├── deploy
│   │   │   └── 00_deploy_your_contract.ts
│   │   ├── scripts
│   │   │   ├── generateAccount.ts
│   │   │   ├── generateTsAbis.ts
│   │   │   ├── importAccount.ts
│   │   │   ├── listAccount.ts
│   │   │   ├── revealPK.ts
│   │   │   └── runHardhatDeployWithPK.ts
│   │   ├── test
│   │   │   └── YourContract.ts
│   │   ├── .env.example
│   │   ├── .gitignore
│   │   ├── .prettierrc.json
│   │   ├── eslint.config.mjs
│   │   ├── hardhat.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── nextjs
│       ├── .next
│       │   └── [ملفات البناء]
│       ├── app
│       │   ├── layout.tsx
│       │   ├── not-found.tsx
│       │   ├── page.tsx
│       │   ├── api
│       │   │   └── mint
│       │   │       └── route.ts
│       │   ├── blockexplorer
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx
│       │   │   ├── _components
│       │   │   ├── address
│       │   │   └── transaction
│       │   ├── dashboard
│       │   │   └── page.tsx
│       │   ├── debug
│       │   │   ├── page.tsx
│       │   │   └── _components
│       │   ├── marketplace
│       │   │   └── page.tsx
│       │   └── mint
│       │       └── page.tsx
│       ├── components
│       │   ├── Footer.tsx
│       │   ├── Header.tsx
│       │   ├── ScaffoldEthAppWithProviders.tsx
│       │   ├── SwitchTheme.tsx
│       │   ├── ThemeProvider.tsx
│       │   ├── assets
│       │   │   └── BuidlGuidlLogo.tsx
│       │   └── scaffold-eth
│       │       ├── BlockieAvatar.tsx
│       │       ├── Faucet.tsx
│       │       ├── FaucetButton.tsx
│       │       ├── index.tsx
│       │       └── RainbowKitCustomConnectButton
│       ├── contracts
│       │   ├── deployedContracts.ts
│       │   └── externalContracts.ts
│       ├── hooks
│       │   └── scaffold-eth
│       │       ├── index.ts
│       │       ├── useContractLogs.ts
│       │       ├── useCopyToClipboard.ts
│       │       ├── useDeployedContractInfo.ts
│       │       ├── useFetchBlocks.ts
│       │       ├── useNetworkColor.ts
│       │       ├── useOutsideClick.ts
│       │       ├── useScaffoldContract.ts
│       │       ├── useScaffoldEventHistory.ts
│       │       ├── useScaffoldReadContract.ts
│       │       ├── useScaffoldWatchContractEvent.ts
│       │       ├── useScaffoldWriteContract.ts
│       │       ├── useSelectedNetwork.ts
│       │       ├── useTargetNetwork.ts
│       │       └── useTransactor.tsx
│       ├── public
│       │   └── manifest.json
│       ├── services
│       │   ├── store
│       │   │   └── store.ts
│       │   └── web3
│       │       ├── wagmiConfig.tsx
│       │       └── wagmiConnectors.tsx
│       ├── styles
│       │   └── globals.css
│       ├── types
│       │   └── abitype
│       │       └── abi.d.ts
│       ├── utils
│       │   └── scaffold-eth
│       │       ├── block.ts
│       │       ├── common.ts
│       │       ├── contract.ts
│       │       ├── contractsData.ts
│       │       ├── decodeTxData.ts
│       │       ├── getMetadata.ts
│       │       ├── getParsedError.ts
│       │       ├── index.ts
│       │       ├── networks.ts
│       │       └── notification.tsx
│       ├── .env.example
│       ├── .env.local
│       ├── .eslintrc.json
│       ├── .gitignore
│       ├── .prettierrc.json
│       ├── eslint.config.mjs
│       ├── next-env.d.ts
│       ├── next.config.ts
│       ├── NNM_MARKET_SETUP.md
│       ├── package.json          ← **ملف package.json الخاص بـ Next.js هنا**
│       ├── postcss.config.js
│       ├── scaffold.config.ts
│       ├── tsconfig.json
│       └── vercel.json
├── .devcontainer
│   ├── devcontainer.json
│   └── Dockerfile
├── .editorconfig
├── .gitignore
├── .nvmrc
├── .prettierignore
├── .prettierrc.json
├── .yarnrc.yml
├── CONTRIBUTING.md
├── funding.json
├── LICENCE
├── package.json                  ← ملف package.json الجذر (لإدارة Monorepo)
├── README.md
├── SETUP_COMPLETE.md
└── yarn.lock

```

---

## ملاحظات مهمة / Important Notes:

### بالنسبة لـ Vercel:
1. **Root Directory يجب أن يكون:** `packages/nextjs`
2. **لا تستخدم** المجلد الجذر للمشروع لأنه Monorepo
3. الملف `/workspaces/nft/packages/nextjs/package.json` يحتوي على جميع dependencies الخاصة بـ Next.js

### البنية:
- المشروع عبارة عن **Monorepo** يحتوي على حزمتين منفصلتين
- كل حزمة لها `package.json` خاص بها
- الحزمة `nextjs` مستقلة ويمكن نشرها بشكل منفصل

### الملفات المستثناة:
- `node_modules` - تم استبعادها من الخريطة
- `.git` - تم استبعادها من الخريطة
- ملفات البناء الأخرى قد تكون موجودة لكن ليست ضرورية للنشر
