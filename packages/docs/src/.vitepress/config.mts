import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Node Redisson',
  description: 'Redisson Library for Node.js',
  base: '/node-redisson',

  locales: {
    root: {
      label: 'English',
      lang: 'en',
    },
    'zh-cn': {
      label: '简体中文',
      lang: 'zh-cn',
      themeConfig: {
        nav: [
          { text: '首页', link: '/zh-cn' },
          { text: '指南', link: '/zh-cn/guide/overview' },
          { text: '配置', link: '/zh-cn/config/overview' },
        ],

        sidebar: [
          {
            text: '指南',
            items: [
              { text: '了解 NodeRedisson', link: '/zh-cn/guide/overview' },
              { text: '快速开始', link: '/zh-cn/guide/getting-started' },
            ],
          },
          {
            text: '锁',
            items: [
              { text: '总览', link: '/zh-cn/locks/overview' },
              { text: 'Lock（可重入锁）', link: '/zh-cn/locks/lock' },
            ],
          },
        ],
      },
    },
  },

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/overview' },
      { text: 'Config', link: '/config/overview' },
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'What is NodeRedisson', link: '/guide/overview' },
          { text: 'Quickstart', link: '/guide/getting-started' },
        ],
      },
      {
        text: 'Locks',
        items: [
          { text: 'Overview', link: '/locks/overview' },
          { text: 'Lock (Reentrant Lock)', link: '/locks/lock' },
        ],
      },
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/smilecc/node-redisson' }],
  },
});
