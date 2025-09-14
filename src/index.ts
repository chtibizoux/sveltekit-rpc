import type { Plugin } from 'vite';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'acorn';
import type { Node } from 'acorn';

interface RouteInfo {
  path: string;
  methods: {
    [key: string]: {
      requestSchema?: string;
      responseSchema?: string;
      paramsSchema?: string;
      searchParamsSchema?: string;
      cookiesSchema?: string;
      headersSchema?: string;
    };
  };
}

interface SvelteKitRPCOptions {
  /**
   * The directory where SvelteKit routes are located
   * @default 'src/routes'
   */
  routesDir?: string;
  /**
   * The output directory for generated types
   * @default '.svelte-kit/types'
   */
  outputDir?: string;
}

function createSvelteKitRPC(options: SvelteKitRPCOptions = {}): Plugin {
  const {
    routesDir = 'src/routes',
    outputDir = '.svelte-kit/types'
  } = options;

  return {
    name: 'sveltekit-rpc',
    configResolved(config) {
      // Ensure the output directory exists
      const fullOutputDir = path.resolve(config.root, outputDir);
      if (!fs.existsSync(fullOutputDir)) {
        fs.mkdirSync(fullOutputDir, { recursive: true });
      }
    },
    buildStart() {
      this.addWatchFile(path.resolve(routesDir));
    },
    async buildEnd() {
      await generateTypes(routesDir, outputDir);
    },
    async handleHotUpdate({ file }) {
      if (file.includes('+server.ts') || file.includes('+server.js')) {
        await generateTypes(routesDir, outputDir);
      }
    }
  };
}

async function generateTypes(routesDir: string, outputDir: string) {
  const routes = await scanRoutes(routesDir);
  const typeDefinitions = generateTypeDefinitions(routes);
  
  const outputPath = path.join(outputDir, 'rpc.d.ts');
  await fs.promises.writeFile(outputPath, typeDefinitions, 'utf-8');
  
  console.log(`Generated SvelteKit RPC types at ${outputPath}`);
}

async function scanRoutes(routesDir: string): Promise<RouteInfo[]> {
  const routes: RouteInfo[] = [];
  
  async function walkDir(dir: string, routePath = '') {
    try {
      const items = await fs.promises.readdir(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory() && !item.name.startsWith('.')) {
          // Handle dynamic routes
          const segmentName = item.name.startsWith('[') && item.name.endsWith(']')
            ? item.name.slice(1, -1)
            : item.name;
          const newRoutePath = `${routePath}/${segmentName}`;
          await walkDir(fullPath, newRoutePath);
        } else if (item.name === '+server.ts' || item.name === '+server.js') {
          const route = await parseServerFile(fullPath, routePath || '/');
          if (route) {
            routes.push(route);
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
      console.warn(`Could not read directory ${dir}:`, error);
    }
  }
  
  await walkDir(routesDir);
  return routes;
}

async function parseServerFile(filePath: string, routePath: string): Promise<RouteInfo | null> {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const ast = parse(content, {
      ecmaVersion: 'latest',
      sourceType: 'module'
    });

    const route: RouteInfo = {
      path: routePath,
      methods: {}
    };

    let hasValidExports = false;

    // Simple AST walking for now
    function walkNode(node: any) {
      if (node.type === 'ExportNamedDeclaration') {
        if (node.declaration?.type === 'FunctionDeclaration') {
          const funcName = node.declaration.id?.name;
          if (funcName && ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(funcName)) {
            route.methods[funcName] = extractSchemas(node.declaration, content);
            hasValidExports = true;
          }
        } else if (node.declaration?.type === 'VariableDeclaration') {
          for (const declarator of node.declaration.declarations) {
            if (declarator.id?.type === 'Identifier') {
              const varName = declarator.id.name;
              if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(varName)) {
                route.methods[varName] = extractSchemas(declarator, content);
                hasValidExports = true;
              }
            }
          }
        }
      }
      
      // Walk child nodes
      if (node.body) {
        if (Array.isArray(node.body)) {
          node.body.forEach(walkNode);
        } else {
          walkNode(node.body);
        }
      }
    }

    walkNode(ast);

    return hasValidExports ? route : null;
  } catch (error) {
    console.warn(`Failed to parse ${filePath}:`, error);
    return null;
  }
}

function extractSchemas(node: any, content: string): {
  requestSchema?: string;
  responseSchema?: string;
  paramsSchema?: string;
  searchParamsSchema?: string;
  cookiesSchema?: string;
  headersSchema?: string;
} {
  const schemas: any = {};
  
  // This is a simplified implementation
  // In a real implementation, you'd need to analyze the function body
  // to find Zod schema definitions and extract their types
  
  // For now, we'll look for common patterns in comments or JSDoc
  const functionText = content.slice(node.start, node.end);
  
  // Look for schema definitions in comments
  const schemaRegex = /@(\w+)Schema\s+([^\s]+)/g;
  let match;
  while ((match = schemaRegex.exec(functionText)) !== null) {
    const [, schemaType, schemaName] = match;
    schemas[`${schemaType}Schema`] = schemaName;
  }
  
  return schemas;
}

function generateTypeDefinitions(routes: RouteInfo[]): string {
  let output = `// Auto-generated by sveltekit-rpc
// Do not edit this file manually

import type { z } from 'zod';

export interface RPCRoutes {
`;

  if (routes.length === 0) {
    output += `  // No routes found
`;
  }

  for (const route of routes) {
    output += `  '${route.path}': {\n`;
    
    for (const [method] of Object.entries(route.methods)) {
      output += `    ${method}: {\n`;
      output += `      body?: any;\n`;
      output += `      params?: any;\n`;
      output += `      searchParams?: any;\n`;
      output += `      cookies?: any;\n`;
      output += `      headers?: any;\n`;
      output += `      response?: any;\n`;
      output += `    };\n`;
    }
    
    output += `  };\n`;
  }

  output += `}

export type RPCClient = {
  [K in keyof RPCRoutes]: {
    [M in keyof RPCRoutes[K]]: (
      input?: Omit<RPCRoutes[K][M], 'response'>
    ) => Promise<RPCRoutes[K][M]['response']>;
  };
};
`;

  return output;
}

// Re-export schema utilities
export * from './schemas.js';

// Export the main plugin
export const svelteKitRPC = createSvelteKitRPC;
export default svelteKitRPC;