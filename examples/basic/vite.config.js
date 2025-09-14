import { svelteKitRPC } from 'sveltekit-rpc';

export default svelteKitRPC({
  routesDir: 'src/routes',
  outputDir: '.svelte-kit/types'
});