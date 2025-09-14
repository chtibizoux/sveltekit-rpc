import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { 
  defineEndpoint, 
  createHandler,
  createParamsSchema,
  createSearchParamsSchema,
  successResponse,
  errorResponse,
  paginatedResponse
} from '../src/schemas.js';

describe('Schema Helpers', () => {
  it('should create params schema', () => {
    const schema = createParamsSchema({
      id: z.string(),
      slug: z.string()
    });
    
    const result = schema.parse({ id: '123', slug: 'test' });
    expect(result).toEqual({ id: '123', slug: 'test' });
  });

  it('should create search params schema', () => {
    const schema = createSearchParamsSchema({
      page: z.coerce.number(),
      limit: z.coerce.number().optional()
    });
    
    const result = schema.parse({ page: '1', limit: '10' });
    expect(result).toEqual({ page: 1, limit: 10 });
  });

  it('should create success response schema', () => {
    const schema = successResponse(z.object({ message: z.string() }));
    const result = schema.parse({
      success: true,
      data: { message: 'Hello' }
    });
    
    expect(result.success).toBe(true);
    expect(result.data.message).toBe('Hello');
  });

  it('should create error response schema', () => {
    const schema = errorResponse();
    const result = schema.parse({
      success: false,
      error: 'Something went wrong'
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Something went wrong');
  });

  it('should create paginated response schema', () => {
    const schema = paginatedResponse(z.object({ id: z.string() }));
    const result = schema.parse({
      items: [{ id: '1' }, { id: '2' }],
      total: 2,
      page: 1,
      limit: 10,
      hasNext: false,
      hasPrev: false
    });
    
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should define endpoint with schemas', () => {
    const endpoint = defineEndpoint({
      body: z.object({ name: z.string() }),
      params: z.object({ id: z.string() }),
      response: z.object({ success: z.boolean() })
    });
    
    expect(endpoint).toHaveProperty('body');
    expect(endpoint).toHaveProperty('params');
    expect(endpoint).toHaveProperty('response');
  });
});