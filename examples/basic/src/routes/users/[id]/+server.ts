import { z } from 'zod';
import { defineEndpoint, createHandler } from 'sveltekit-rpc';

// Define the schema for this endpoint
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

// Type-safe handler
export const GET = createHandler(userEndpoint, async ({ params, searchParams }) => {
  // params.id is typed as string
  // searchParams.include is typed as string | undefined
  
  const user = {
    id: params.id,
    name: 'John Doe',
    email: 'john@example.com'
  };
  
  if (searchParams.include === 'profile') {
    return {
      ...user,
      profile: {
        bio: 'Software developer',
        avatar: 'https://example.com/avatar.jpg'
      }
    };
  }
  
  return user;
});