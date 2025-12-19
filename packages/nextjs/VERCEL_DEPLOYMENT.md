# Vercel Deployment Fix

## Changes Made:

### 1. `.npmrc` - Disable Native Builds
```properties
strict-peer-dependencies = false
optional = false
ignore-scripts = true
```

### 2. `.yarnrc.yml` - Yarn Configuration
```yaml
nodeLinker: node-modules
enableScripts: false
enableImmutableInstalls: false
```

### 3. `vercel.json` - Vercel Settings
```json
{
  "buildCommand": "yarn build",
  "framework": "nextjs",
  "installCommand": "yarn install --ignore-scripts",
  "env": {
    "YARN_ENABLE_IMMUTABLE_INSTALLS": "false",
    "ENABLE_EXPERIMENTAL_COREPACK": "1"
  }
}
```

## Why This Works:

- `ignore-scripts = true` prevents post-install scripts from running (including native builds like cpu-features)
- `enableScripts: false` in .yarnrc.yml adds extra protection
- `--ignore-scripts` flag in Vercel install command ensures no native compilation
- This allows the Next.js frontend to build without requiring Hardhat's native dependencies

## Vercel Settings (If Needed):

Go to your Vercel project settings and add these environment variables:
- `NEXT_PUBLIC_GATEWAY_URL` - Your IPFS gateway URL
- `PINATA_JWT` - Your Pinata JWT token
- Any other environment variables your app needs

The build should now complete successfully! 🚀
