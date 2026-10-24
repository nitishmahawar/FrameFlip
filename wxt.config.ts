import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'FrameFlip',
    description: 'Transform, adjust, and download videos on the current page.',
    permissions: ['activeTab', 'scripting', 'downloads', 'storage'],
  },
});

