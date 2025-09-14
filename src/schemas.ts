import { z } from 'zod';

/**
 * Schema helpers for common SvelteKit request/response patterns
 */

/**
 * Schema for URL parameters (e.g., [slug] in routes)
 */
export const createParamsSchema = <T extends Record<string, z.ZodTypeAny>>(params: T) => {
  return z.object(params);
};

/**
 * Schema for search parameters (query string)
 */
export const createSearchParamsSchema = <T extends Record<string, z.ZodTypeAny>>(params: T) => {
  return z.object(params);
};

/**
 * Schema for request headers
 */
export const createHeadersSchema = <T extends Record<string, z.ZodTypeAny>>(headers: T) => {
  return z.object(headers);
};

/**
 * Schema for cookies
 */
export const createCookiesSchema = <T extends Record<string, z.ZodTypeAny>>(cookies: T) => {
  return z.object(cookies);
};

/**
 * Common response schemas
 */
export const successResponse = <T extends z.ZodTypeAny>(data: T) => {
  return z.object({
    success: z.literal(true),
    data
  });
};

export const errorResponse = (message = z.string()) => {
  return z.object({
    success: z.literal(false),
    error: message
  });
};

export const paginatedResponse = <T extends z.ZodTypeAny>(item: T) => {
  return z.object({
    items: z.array(item),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean()
  });
};

/**
 * Utility for defining route schemas with metadata
 */
export function defineEndpoint<
  TBody extends z.ZodTypeAny = z.ZodVoid,
  TParams extends z.ZodTypeAny = z.ZodVoid,
  TSearchParams extends z.ZodTypeAny = z.ZodVoid,
  TCookies extends z.ZodTypeAny = z.ZodVoid,
  THeaders extends z.ZodTypeAny = z.ZodVoid,
  TResponse extends z.ZodTypeAny = z.ZodVoid
>(config: {
  body?: TBody;
  params?: TParams;
  searchParams?: TSearchParams;
  cookies?: TCookies;
  headers?: THeaders;
  response?: TResponse;
}) {
  return {
    body: config.body || z.void(),
    params: config.params || z.void(),
    searchParams: config.searchParams || z.void(),
    cookies: config.cookies || z.void(),
    headers: config.headers || z.void(),
    response: config.response || z.void()
  };
}

/**
 * Type-safe request handler wrapper
 */
export function createHandler<T extends ReturnType<typeof defineEndpoint>>(
  schema: T,
  handler: (input: {
    body: z.infer<T['body']>;
    params: z.infer<T['params']>;
    searchParams: z.infer<T['searchParams']>;
    cookies: z.infer<T['cookies']>;
    headers: z.infer<T['headers']>;
  }) => Promise<z.infer<T['response']>> | z.infer<T['response']>
) {
  return async (event: any) => {
    try {
      const body = schema.body._def.typeName !== 'ZodVoid' 
        ? schema.body.parse(await event.request.json())
        : undefined;
      
      const params = schema.params._def.typeName !== 'ZodVoid'
        ? schema.params.parse(event.params)
        : undefined;
      
      const searchParams = schema.searchParams._def.typeName !== 'ZodVoid'
        ? schema.searchParams.parse(Object.fromEntries(event.url.searchParams))
        : undefined;
      
      const cookies = schema.cookies._def.typeName !== 'ZodVoid'
        ? schema.cookies.parse(Object.fromEntries(
            [...event.cookies].map(([name, value]) => [name, value])
          ))
        : undefined;
      
      const headers = schema.headers._def.typeName !== 'ZodVoid'
        ? schema.headers.parse(Object.fromEntries(event.request.headers))
        : undefined;
      
      const result = await handler({
        body,
        params,
        searchParams,
        cookies,
        headers
      });
      
      const validatedResult = schema.response._def.typeName !== 'ZodVoid'
        ? schema.response.parse(result)
        : result;
      
      return new Response(JSON.stringify(validatedResult), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Validation error',
          details: error.errors
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      throw error;
    }
  };
}