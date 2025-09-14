import { z } from 'zod';
import { defineEndpoint, createHandler } from 'sveltekit-rpc';

// POST endpoint for creating posts
const createPostEndpoint = defineEndpoint({
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
    createdAt: z.string(),
    authorId: z.string()
  })
});

export const POST = createHandler(createPostEndpoint, async ({ body, headers }) => {
  // body is typed as { title: string; content: string; tags?: string[] }
  // headers is typed as { authorization: string }
  
  // Simulate creating a post
  return {
    id: 'post-123',
    title: body.title,
    content: body.content,
    tags: body.tags || [],
    createdAt: new Date().toISOString(),
    authorId: 'user-456'
  };
});

// GET endpoint for listing posts
const listPostsEndpoint = defineEndpoint({
  searchParams: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
    tag: z.string().optional()
  }),
  response: z.object({
    posts: z.array(z.object({
      id: z.string(),
      title: z.string(),
      excerpt: z.string(),
      tags: z.array(z.string()),
      createdAt: z.string()
    })),
    total: z.number(),
    page: z.number(),
    limit: z.number()
  })
});

export const GET = createHandler(listPostsEndpoint, async ({ searchParams }) => {
  // searchParams is typed as { page: number; limit: number; tag?: string }
  
  const mockPosts = [
    {
      id: 'post-1',
      title: 'First Post',
      excerpt: 'This is the first post...',
      tags: ['tech', 'programming'],
      createdAt: new Date().toISOString()
    },
    {
      id: 'post-2',
      title: 'Second Post',
      excerpt: 'This is the second post...',
      tags: ['design', 'ui'],
      createdAt: new Date().toISOString()
    }
  ];
  
  const filteredPosts = searchParams.tag
    ? mockPosts.filter(post => post.tags.includes(searchParams.tag!))
    : mockPosts;
  
  return {
    posts: filteredPosts,
    total: filteredPosts.length,
    page: searchParams.page,
    limit: searchParams.limit
  };
});