import { describe, it, expect } from 'vitest';
import { createRPCClient, typedFetch } from '../src/client.js';

describe('RPC Client', () => {
  it('should create RPC client', () => {
    const client = createRPCClient();
    expect(client).toBeDefined();
    expect(typeof client).toBe('object');
  });

  it('should create RPC client with base URL', () => {
    const client = createRPCClient('https://api.example.com');
    expect(client).toBeDefined();
  });

  it('should have typedFetch function', () => {
    expect(typeof typedFetch).toBe('function');
  });
});