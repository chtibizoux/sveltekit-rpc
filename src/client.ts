import type { RPCRoutes, RPCClient } from './types.js';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions {
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
}

/**
 * Create a type-safe RPC client for SvelteKit API routes
 */
export function createRPCClient(baseUrl = ''): RPCClient {
  const client = {} as RPCClient;

  // This would be populated by the build process based on discovered routes
  // For now, we'll create a Proxy to handle dynamic route access
  return new Proxy(client, {
    get(target, routePath: string) {
      return new Proxy({}, {
        get(_, method: string) {
          return async (input: any) => {
            const url = new URL(`${baseUrl}${routePath}`);
            
            // Handle URL parameters
            if (input.params) {
              let finalPath = routePath;
              for (const [key, value] of Object.entries(input.params as Record<string, any>)) {
                finalPath = finalPath.replace(`[${key}]`, encodeURIComponent(String(value)));
              }
              url.pathname = finalPath;
            }
            
            // Handle search parameters
            if (input.searchParams) {
              for (const [key, value] of Object.entries(input.searchParams as Record<string, any>)) {
                url.searchParams.set(key, String(value));
              }
            }
            
            const requestInit: RequestInit = {
              method: method as HttpMethod,
              headers: {
                'Content-Type': 'application/json',
                ...input.headers
              }
            };
            
            // Handle request body
            if (input.body && ['POST', 'PUT', 'PATCH'].includes(method)) {
              requestInit.body = JSON.stringify(input.body);
            }
            
            // Handle cookies (in browser environment)
            if (input.cookies && typeof document !== 'undefined') {
              for (const [key, value] of Object.entries(input.cookies as Record<string, string>)) {
                document.cookie = `${key}=${value}`;
              }
            }
            
            const response = await fetch(url.toString(), requestInit);
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
              return response.json();
            }
            
            return response.text();
          };
        }
      });
    }
  }) as RPCClient;
}

/**
 * Type-safe wrapper for SvelteKit's fetch function
 */
export function typedFetch<
  TRoute extends keyof RPCRoutes,
  TMethod extends keyof RPCRoutes[TRoute]
>(
  route: TRoute,
  method: TMethod,
  input: Omit<RPCRoutes[TRoute][TMethod], 'response'>,
  options?: RequestOptions
): Promise<RPCRoutes[TRoute][TMethod]['response']> {
  const client = createRPCClient();
  return (client[route] as any)[method](input);
}

/**
 * Utility type for extracting request types
 */
export type RequestType<
  TRoute extends keyof RPCRoutes,
  TMethod extends keyof RPCRoutes[TRoute]
> = Omit<RPCRoutes[TRoute][TMethod], 'response'>;

/**
 * Utility type for extracting response types
 */
export type ResponseType<
  TRoute extends keyof RPCRoutes,
  TMethod extends keyof RPCRoutes[TRoute]
> = RPCRoutes[TRoute][TMethod]['response'];

/**
 * Utility for creating Zod schemas with RPC metadata
 */
export function defineRoute<T extends Record<string, any>>(schemas: T): T {
  return schemas;
}

// Re-export types for convenience
export type { RPCRoutes, RPCClient } from './types.js';