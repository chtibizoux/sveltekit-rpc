import { describe, it, expect } from 'vitest';
import { svelteKitRPC } from '../src/index.js';

describe('SvelteKit RPC Plugin', () => {
  it('should create a plugin with correct name', () => {
    const plugin = svelteKitRPC();
    expect(plugin.name).toBe('sveltekit-rpc');
  });

  it('should accept configuration options', () => {
    const plugin = svelteKitRPC({
      routesDir: 'custom/routes',
      outputDir: 'custom/output'
    });
    expect(plugin.name).toBe('sveltekit-rpc');
  });

  it('should have the required plugin methods', () => {
    const plugin = svelteKitRPC();
    expect(plugin).toHaveProperty('configResolved');
    expect(plugin).toHaveProperty('buildStart');
    expect(plugin).toHaveProperty('buildEnd');
    expect(plugin).toHaveProperty('handleHotUpdate');
  });
});