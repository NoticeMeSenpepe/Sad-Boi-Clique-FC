import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `dedupe` forces every import of react / react-dom to resolve to the
// single copy hoisted in the project's node_modules. Without it,
// `@vercel/analytics/react` (which has React in its peerDeps) ended up
// pulling a second copy through Vite's pre-bundle, triggering React's
// "Invalid hook call" warning at runtime.
export default defineConfig({
  plugins: [react()],
  resolve: { dedupe: ['react', 'react-dom'] },
  server: { port: 5173, host: true }
});
