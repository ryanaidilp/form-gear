import { defineConfig } from "vite";
import path from 'path';
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  plugins: [solidPlugin()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.tsx'),
      name: 'FormGear',
      formats: ['es', 'umd'],
      fileName: (format) => `form-gear.${format}.js`,
    },
    rollupOptions: {
      // Externalize SolidJS for consumers who want to provide their own
      external: [],
      output: {
        // Global variable names for UMD build
        globals: {},
        // Preserve module structure for better tree-shaking
        preserveModules: false,
      },
    },
    // Generate sourcemaps for debugging
    sourcemap: true,
    // Use esbuild for minification (built-in, fast)
    minify: 'esbuild',
    // Target ES2015 for better mobile WebView compatibility
    // (iOS Safari 10+, Android WebView 51+)
    target: 'es2015',
    // CSS code splitting
    cssCodeSplit: false,
    // Chunk size warning limit (in kB)
    chunkSizeWarningLimit: 700,
  },
  // Resolve aliases for cleaner imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
