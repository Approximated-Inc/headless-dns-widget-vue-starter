import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';

const projectDir = fileURLToPath(new URL('.', import.meta.url));
export default {
  configFile: false,
  root: fileURLToPath(new URL('./src/', import.meta.url)),
  envDir: projectDir,
  plugins: [vue()],
  build: { outDir: '../dist', emptyOutDir: true },
  server: { fs: { allow: [projectDir] } }
};
