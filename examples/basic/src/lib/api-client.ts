import { createRPCClient, typedFetch } from 'sveltekit-rpc/client';

// Create a type-safe client
const api = createRPCClient();

// Usage examples:

// GET user by ID with type safety
async function getUser(id: string, includeProfile = false) {
  const user = await api['/users/[id]'].GET({
    params: { id },
    searchParams: includeProfile ? { include: 'profile' } : {}
  });
  
  // user is fully typed based on the response schema
  console.log(user.name); // ✅ TypeScript knows this exists
  console.log(user.profile?.bio); // ✅ Optional chaining works
}

// Create a new post
async function createPost(title: string, content: string, token: string) {
  const post = await api['/api/posts'].POST({
    body: { title, content },
    headers: { authorization: token }
  });
  
  // post is fully typed
  console.log(post.id); // ✅ TypeScript knows this exists
  return post;
}

// List posts with pagination
async function listPosts(page = 1, tag?: string) {
  const result = await api['/api/posts'].GET({
    searchParams: { page, limit: 10, tag }
  });
  
  // result is fully typed
  console.log(`Found ${result.total} posts`);
  return result.posts;
}

// Alternative using typedFetch function
async function getUserAlternative(id: string) {
  return typedFetch('/users/[id]', 'GET', {
    params: { id },
    searchParams: {}
  });
}

// Usage in SvelteKit pages
export async function load({ params }) {
  const user = await getUser(params.id);
  const posts = await listPosts(1);
  
  return {
    user,
    posts
  };
}