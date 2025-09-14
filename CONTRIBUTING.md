# Contributing

Thank you for your interest in contributing to SvelteKit RPC!

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/chtibizoux/sveltekit-rpc.git
cd sveltekit-rpc
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Run tests:
```bash
npm test
```

## Project Structure

```
src/
├── index.ts       # Main plugin implementation
├── client.ts      # Client-side utilities
├── schemas.ts     # Zod schema helpers
└── types.ts       # TypeScript type definitions

tests/
├── plugin.test.ts
├── client.test.ts
└── schemas.test.ts

examples/
└── basic/         # Example SvelteKit project
```

## Development Workflow

1. Make your changes
2. Add tests for new functionality
3. Run `npm run typecheck` to check TypeScript
4. Run `npm test` to run the test suite
5. Run `npm run build` to build the project
6. Test with the demo: `node demo.js`

## Future Improvements

- [ ] Enhanced AST parsing for better schema extraction
- [ ] Support for more complex Zod schemas
- [ ] Integration with SvelteKit's built-in types
- [ ] WebSocket support for real-time APIs
- [ ] OpenAPI schema generation
- [ ] Documentation generation from schemas