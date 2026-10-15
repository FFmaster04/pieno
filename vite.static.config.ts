import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath,URL} from 'node:url';
export default defineConfig({
 root:'static',publicDir:'../public',base:process.env.PAGES_BASE_PATH||'/',
 plugins:[react()],resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},
 define:{'import.meta.env.VITE_STATIC_DATA':JSON.stringify('true')},
 build:{outDir:'../dist-static',emptyOutDir:true,chunkSizeWarningLimit:600},
});
