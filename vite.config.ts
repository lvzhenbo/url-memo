import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.config';
import Compression from 'unplugin-compression/vite';
import { name, version } from './package.json';
import { visualizer } from 'rollup-plugin-visualizer';

import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: true,
    // 解决HMR失效问题
    strictPort: true,
    port: 5173,
    hmr: {
      clientPort: 5173,
    },
  },
  plugins: [
    vue(),
    vueJsx(),
    AutoImport({
      imports: [
        'vue',
        {
          'naive-ui': ['useDialog', 'useMessage', 'useNotification', 'useLoadingBar'],
        },
      ],
      eslintrc: {
        enabled: true,
      },
    }),
    Components({
      resolvers: [NaiveUiResolver()],
    }),
    crx({ manifest }),
    Compression({
      formatter() {
        return `${name}-${version}.zip`;
      },
      compressingOptions: {
        ignoreBase: true,
      },
    }),
    visualizer(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
