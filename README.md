# SvelteKit RPC

The best way to type your SvelteKit API routes with end-to-end type safety, similar to Hono RPC or tRPC.

## Features

- 🔒 **End-to-end type safety** - From server to client with zero boilerplate
- 🎯 **Zod integration** - Validate requests and responses with Zod schemas
- 🚀 **Zero runtime overhead** - All types are generated at build time
- 📝 **IntelliSense support** - Full autocompletion for API routes and types
- 🔄 **Hot reload** - Types are regenerated when API routes change
- 🎨 **Framework agnostic client** - Use the generated types anywhere

## Installation

```bash
npm install sveltekit-rpc zod
```

## Quick Start

### 1. Add the plugin to your Vite config

```js
// vite.config.js
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteKitRPC } from 'sveltekit-rpc';

export default {
  plugins: [
    sveltekit(),
    svelteKitRPC({
      routesDir: 'src/routes',
      outputDir: '.svelte-kit/types'
    })
  ]
};
```

### 2. Define your API routes with Zod schemas

```ts
// src/routes/api/users/[id]/+server.ts
import { z } from 'zod';
import { defineEndpoint, createHandler } from 'sveltekit-rpc';

const userEndpoint = defineEndpoint({
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

export const GET = createHandler(userEndpoint, async ({ params, searchParams }) => {
  // All parameters are fully typed!
  const user = await getUserById(params.id);
  
  if (searchParams.include === 'profile') {
    return { ...user, profile: await getUserProfile(user.id) };
  }
  
  return user;
});
```

### 3. Use the type-safe client

```ts
// src/lib/api.ts
import { createRPCClient } from 'sveltekit-rpc/client';

const api = createRPCClient();

// Fully typed API calls!
const user = await api['/api/users/[id]'].GET({
  params: { id: '123' },
  searchParams: { include: 'profile' }
});

// TypeScript knows the exact shape of the response
console.log(user.name); // ✅ Typed
console.log(user.profile?.bio); // ✅ Optional chaining works
```

## API Reference

### `defineEndpoint(config)`

Define schemas for your API endpoint:

```ts
const endpoint = defineEndpoint({
  body: z.object({ title: z.string() }),        // Request body
  params: z.object({ id: z.string() }),         // URL parameters
  searchParams: z.object({ page: z.number() }), // Query parameters
  cookies: z.object({ token: z.string() }),     // Cookies
  headers: z.object({ auth: z.string() }),      // Headers
  response: z.object({ id: z.string() })        // Response
});
```

### `createHandler(schema, handler)`

Create a type-safe request handler:

```ts
export const POST = createHandler(endpoint, async ({ body, params, searchParams, cookies, headers }) => {
  // All parameters are typed based on your schemas
  return { id: 'new-id' };
});
```

### `createRPCClient(baseUrl?)`

Create a type-safe API client:

```ts
const api = createRPCClient('https://api.example.com');

const result = await api['/path'].METHOD({
  // Typed based on your endpoint schemas
});
```

### Schema Helpers

```ts
import {
  createParamsSchema,
  createSearchParamsSchema,
  createHeadersSchema,
  createCookiesSchema,
  successResponse,
  errorResponse,
  paginatedResponse
} from 'sveltekit-rpc';

// Common patterns
const params = createParamsSchema({ id: z.string() });
const searchParams = createSearchParamsSchema({ page: z.number() });
const response = successResponse(z.object({ data: z.string() }));
```

## Examples

### CRUD API

```ts
// src/routes/api/posts/+server.ts
import { z } from 'zod';
import { defineEndpoint, createHandler } from 'sveltekit-rpc';

const createPost = defineEndpoint({
  body: z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    tags: z.array(z.string()).optional()
  }),
  headers: z.object({
    authorization: z.string()
  }),
  response: z.object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    tags: z.array(z.string()),
    createdAt: z.string()
  })
});

export const POST = createHandler(createPost, async ({ body, headers }) => {
  // Validate auth token
  const user = await validateToken(headers.authorization);
  
  // Create post
  const post = await createPostInDB({
    ...body,
    authorId: user.id
  });
  
  return post;
});

const listPosts = defineEndpoint({
  searchParams: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
    tag: z.string().optional()
  }),
  response: z.object({
    posts: z.array(z.object({
      id: z.string(),
      title: z.string(),
      excerpt: z.string()
    })),
    total: z.number(),
    hasNext: z.boolean()
  })
});

export const GET = createHandler(listPosts, async ({ searchParams }) => {
  return await getPaginatedPosts(searchParams);
});
```

### Client Usage

```ts
// src/lib/posts.ts
import { createRPCClient } from 'sveltekit-rpc/client';

const api = createRPCClient();

export async function createPost(data: { title: string; content: string }, token: string) {
  return api['/api/posts'].POST({
    body: data,
    headers: { authorization: token }
  });
}

export async function listPosts(page = 1, tag?: string) {
  return api['/api/posts'].GET({
    searchParams: { page, limit: 10, tag }
  });
}
```

## Configuration

The plugin accepts the following options:

```ts
svelteKitRPC({
  // Directory containing your SvelteKit routes
  routesDir: 'src/routes', // default

  // Output directory for generated types
  outputDir: '.svelte-kit/types' // default
})
```

## How it Works

1. **Build-time scanning**: The plugin scans your `+server.ts` files during the build process
2. **Schema extraction**: It extracts Zod schemas from your route handlers
3. **Type generation**: Generates TypeScript definitions in `.svelte-kit/types/rpc.d.ts`
4. **Client integration**: The client uses these types to provide end-to-end type safety

## License

MIT
