// Test runner config. Reuses vite.config.js (React plugin, JSX-in-.js loader) and only adds
// test settings, so the app's own build config is untouched.
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.js';

export default mergeConfig(viteConfig, defineConfig({
    // vite.config.js only compiles JSX under src/; tests live in tests/
    esbuild: { loader: 'jsx', include: /(src|tests)\/.*\.jsx?$/ },
    test: {
        environment: 'jsdom',
        include: ['tests/**/*.test.{js,jsx}'],
        setupFiles: ['tests/setup.js'],
        restoreMocks: true,
    },
}));
