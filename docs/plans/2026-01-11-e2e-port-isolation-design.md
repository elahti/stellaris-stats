# E2E Test Port Isolation Design

## Problem

When running production services (`npm run graphql-server:run` and `npm run ui:dev`) alongside E2E tests (`npm run test:ci:e2e`), port conflicts occur because both environments attempt to use port 4000 for the GraphQL server.

Error observed:

```
Error: listen EADDRINUSE: address already in use :::4000
```

Root causes:

1. `testGraphQLServerMain.ts` defaults to port 4000
2. `vite.config.ts` hardcodes proxy to `http://localhost:4000`
3. No port configuration in test environment files

## Solution

Configure separate ports for each environment using environment variables, enabling all environments to run simultaneously.

### Port Allocation

| Environment  | GraphQL Port | Vite Port | Use Case            |
| ------------ | ------------ | --------- | ------------------- |
| Production   | 4000         | 5173      | Normal development  |
| E2E Tests    | 4100         | 5273      | Playwright UI tests |
| Python Evals | 4200         | N/A       | AI budget analysis  |

## Implementation

### 1. Environment Files

**`.env.stellaris-stats.tests`** - add/modify:

```env
STELLARIS_STATS_VITE_PORT=5273
STELLARIS_STATS_GRAPHQL_SERVER_PORT=4100
```

**`.env.stellaris-stats.evals`** - add:

```env
STELLARIS_STATS_GRAPHQL_SERVER_PORT=4200
```

### 2. Vite Configuration

**`ui/vite.config.ts`** - read ports from environment using Zod:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import z from 'zod/v4'

const ViteConfig = z.object({
  serverPort: z.coerce.number().default(5173),
  graphqlServerPort: z.coerce.number().default(4000),
})

const config = ViteConfig.parse({
  serverPort: process.env.STELLARIS_STATS_VITE_PORT,
  graphqlServerPort: process.env.STELLARIS_STATS_GRAPHQL_SERVER_PORT,
})

const graphqlUrl = `http://localhost:${config.graphqlServerPort}`

export default defineConfig({
  plugins: [react(), vanillaExtractPlugin()],
  server: {
    port: config.serverPort,
    host: true,
    proxy: {
      '/graphql': graphqlUrl,
      '/api': graphqlUrl,
    },
  },
})
```

### 3. Test GraphQL Server

**`src/graphql/testGraphQLServerMain.ts`** - use standard env var with Zod:

```typescript
import z from 'zod/v4'

const TestServerConfig = z.object({
  port: z.coerce.number().default(4000),
})

const getServerConfig = () =>
  TestServerConfig.parse({
    port: process.env.STELLARIS_STATS_GRAPHQL_SERVER_PORT,
  })
```

Replace the existing `getServerPort()` function with this approach.

### 4. No Changes Required

These files already handle port configuration correctly:

- **`ui/playwright.config.ts`** - uses `STELLARIS_STATS_VITE_HOST` and `STELLARIS_STATS_VITE_PORT` env vars
- **`ui/playwright/global-setup.ts`** - spreads `process.env` to child process, inheriting port config
- **`agent/src/agent/evals/server_manager.py`** - spreads `os.environ` and parses port from `SERVER_READY:` output

## Verification

After implementation, verify all three environments can run simultaneously:

```bash
# Terminal 1: Production
npm run graphql-server:run  # Port 4000
npm run ui:dev              # Port 5173

# Terminal 2: E2E Tests
npm run test:ci:e2e         # Ports 4100/5273

# Terminal 3: Python Evals
npm run agent:evals -- --dataset multi_agent_drop_detection  # Port 4200
```

## Migration

No breaking changes. Existing workflows continue to work:

- Production uses defaults (4000/5173) when env vars are not set
- Test/eval environments get isolated ports from their env files
