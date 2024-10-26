import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.js',
      userscript: {
        name: {
          '': 'BetterPixivMobile',
          ja: 'BetterPixivMobile',
        },
        namespace: 'https://github.com/irohosi-pixel/BetterPixivMobile',
        description: {
          '': 'Make browsing Pixiv more convenient and comfortable.',
          ja: 'Pixivの閲覧をもっと便利・快適にします。',
        },
        icon: 'https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=32&url=https://www.pixiv.net',
        icon64:
          'https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=64&url=https://www.pixiv.net',
        match: ['*://www.pixiv.net/*'],
        license: 'GPLv3',
        author: 'Irohosi Pixel(色星ぴくせる)',
        supportURL: 'https://github.com/irohosi-pixel/BetterPixivMobile/issues',
        noframes: true,
      },
      build: {
        fileName: 'BetterPixivMobile.user.js',
      },
    }),
  ],
});
