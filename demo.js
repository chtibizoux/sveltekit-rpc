// Demo script to test the plugin functionality
import { svelteKitRPC } from './dist/index.js';
import fs from 'fs';
import path from 'path';

// Create a mock SvelteKit project structure
const demoDir = 'demo-project';
const routesDir = path.join(demoDir, 'src', 'routes');
const outputDir = path.join(demoDir, '.svelte-kit', 'types');

// Create directories
fs.mkdirSync(routesDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });

// Create sample route files
const userRoute = `import { z } from 'zod';
import { defineEndpoint, createHandler } from 'sveltekit-rpc';

const getUserEndpoint = defineEndpoint({
  params: z.object({
    id: z.string()
  }),
  response: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string()
  })
});

export const GET = createHandler(getUserEndpoint, async ({ params }) => {
  return {
    id: params.id,
    name: 'John Doe',
    email: 'john@example.com'
  };
});`;

const postsRoute = `import { z } from 'zod';
import { defineEndpoint, createHandler } from 'sveltekit-rpc';

const createPostEndpoint = defineEndpoint({
  body: z.object({
    title: z.string(),
    content: z.string()
  }),
  response: z.object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    createdAt: z.string()
  })
});

export const POST = createHandler(createPostEndpoint, async ({ body }) => {
  return {
    id: 'post-123',
    title: body.title,
    content: body.content,
    createdAt: new Date().toISOString()
  };
});

const listPostsEndpoint = defineEndpoint({
  searchParams: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10)
  }),
  response: z.object({
    posts: z.array(z.object({
      id: z.string(),
      title: z.string(),
      excerpt: z.string()
    })),
    total: z.number()
  })
});

export const GET = createHandler(listPostsEndpoint, async ({ searchParams }) => {
  return {
    posts: [
      { id: '1', title: 'First Post', excerpt: 'First post excerpt' },
      { id: '2', title: 'Second Post', excerpt: 'Second post excerpt' }
    ],
    total: 2
  };
});`;

// Write route files
fs.mkdirSync(path.join(routesDir, 'users', '[id]'), { recursive: true });
fs.writeFileSync(path.join(routesDir, 'users', '[id]', '+server.ts'), userRoute);

fs.mkdirSync(path.join(routesDir, 'api', 'posts'), { recursive: true });
fs.writeFileSync(path.join(routesDir, 'api', 'posts', '+server.ts'), postsRoute);

console.log('Demo project structure created:');
console.log('- src/routes/users/[id]/+server.ts');
console.log('- src/routes/api/posts/+server.ts');

// Create and configure the plugin
const plugin = svelteKitRPC({
  routesDir: path.join(demoDir, 'src', 'routes'),
  outputDir: path.join(demoDir, '.svelte-kit', 'types')
});

console.log('\nPlugin created:', plugin.name);

// Simulate the build process
console.log('\nSimulating build process...');

// Mock config for configResolved
const mockConfig = {
  root: demoDir
};

plugin.configResolved(mockConfig);
console.log('✓ Plugin configured');

// Simulate buildEnd (this generates the types)
try {
  await plugin.buildEnd();
  console.log('✓ Types generated successfully');
  
  // Check if the types file was created
  const typesFile = path.join(outputDir, 'rpc.d.ts');
  if (fs.existsSync(typesFile)) {
    console.log('✓ Generated types file exists');
    const content = fs.readFileSync(typesFile, 'utf-8');
    console.log('\nGenerated types preview:');
    console.log('---');
    console.log(content.substring(0, 500) + '...');
    console.log('---');
  } else {
    console.log('✗ Types file not found');
  }
} catch (error) {
  console.error('✗ Error during type generation:', error.message);
}

console.log('\nDemo completed!');
console.log('\nNext steps:');
console.log('1. Install the plugin in your SvelteKit project');
console.log('2. Add it to your vite.config.js');
console.log('3. Define your API routes with Zod schemas');
console.log('4. Use the generated types in your client code');