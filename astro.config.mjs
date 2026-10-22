// @ts-check
import { defineConfig } from 'astro/config';

// Static output: `npm run build` writes plain files to dist/, which any static
// host can serve. Netlify is pre-configured in netlify.toml. If server routes
// are ever needed, add the adapter: `npx astro add netlify`.
export default defineConfig({
  site: 'https://trykitchen.ai',
  output: 'static',
});
