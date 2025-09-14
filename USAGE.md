# Usage Example

This example demonstrates how to use the SvelteKit RPC plugin in a real project.

## Setup

1. Install the plugin:
```bash
npm install sveltekit-rpc zod
```

2. Add to your `vite.config.js`:
```js
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteKitRPC } from 'sveltekit-rpc';

export default {
  plugins: [
    sveltekit(),
    svelteKitRPC()
  ]
};
```

## Create API Routes

Define your API routes with Zod schemas:

```ts
// src/routes/api/users/[id]/+server.ts
import { z } from 'zod';
import { defineEndpoint, createHandler } from 'sveltekit-rpc';

const getUserEndpoint = defineEndpoint({
  params: z.object({
    id: z.string()
  }),
  searchParams: z.object({
    include: z.string().optional()
  }),
  response: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    profile: z.object({
      bio: z.string(),
      avatar: z.string()
    }).optional()
  })
});

export const GET = createHandler(getUserEndpoint, async ({ params, searchParams }) => {
  const user = await getUserById(params.id);
  
  if (searchParams.include === 'profile') {
    return { ...user, profile: await getUserProfile(user.id) };
  }
  
  return user;
});
```

## Use the Client

Create a type-safe API client:

```ts
// src/lib/api.ts
import { createRPCClient } from 'sveltekit-rpc/client';

const api = createRPCClient();

// Fully typed API calls
export async function getUser(id: string, includeProfile = false) {
  return api['/api/users/[id]'].GET({
    params: { id },
    searchParams: includeProfile ? { include: 'profile' } : {}
  });
}

// Use in your Svelte components
export async function load({ params }) {
  const user = await getUser(params.id, true);
  // user is fully typed with IntelliSense support!
  
  return { user };
}
```

## Benefits

- **Type Safety**: Full end-to-end type safety from server to client
- **Developer Experience**: IntelliSense autocomplete for all API routes
- **Runtime Validation**: Automatic request/response validation with Zod
- **Hot Reload**: Types update automatically when you change API routes
- **Zero Boilerplate**: No manual type definitions needed