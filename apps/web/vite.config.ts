import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';

function spaNotFound(): Plugin {
  return {
    name: 'spa-404',
    apply: 'build',
    closeBundle() {
      const index = path.resolve(__dirname, 'dist/index.html');
      const dest = path.resolve(__dirname, 'dist/404.html');
      if (existsSync(index)) copyFileSync(index, dest);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '../..'), '');
  const apiTarget = env.VITE_API_URL || env.PUBLIC_API_URL || 'http://localhost:3000';
  const proxy = {
    '/v1': {
      target: apiTarget,
      changeOrigin: true,
      ws: true,
    },
    '/health': { target: apiTarget, changeOrigin: true },
    '/ready': { target: apiTarget, changeOrigin: true },
    '/sitemap.xml': { target: apiTarget, changeOrigin: true },
  };

  return {
    envDir: path.resolve(__dirname, '../..'),
    plugins: [
      TanStackRouterVite({
        target: 'react',
        autoCodeSplitting: true,
        routesDirectory: './src/app/routes',
        generatedRouteTree: './src/app/routeTree.gen.ts',
      }),
      react(),
      tailwindcss(),
      spaNotFound(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy,
    },
    preview: {
      port: 5173,
      proxy,
    },
  };
});
