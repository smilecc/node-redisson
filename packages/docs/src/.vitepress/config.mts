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
        ],
      },
    },
  },

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' },
    ],

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' },
        ],
      },
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/smilecc/node-redisson' }],
  },
});
