import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'CodeExplain',
  tagline: 'AI-Powered Code Documentation & Analysis Platform',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  // For GitHub Pages: use 'https://nanaagyei.github.io' and baseUrl: '/code-explain/'
  // For Railway/Vercel/Netlify: use your custom domain and baseUrl: '/'
  url: 'https://nanaagyei.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: '/code-explain/',

  // GitHub pages deployment config.
  organizationName: 'nanaagyei', // GitHub org/user name
  projectName: 'code-explain', // GitHub repo name

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          editUrl: 'https://github.com/nanaagyei/code-explain/tree/main/docs/',
        },
        blog: false, // Blog disabled - remove this line and uncomment below to enable
        // blog: {
        //   showReadingTime: true,
        //   editUrl: 'https://github.com/nanaagyei/code-explain/tree/main/docs/',
        // },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/android-chrome-512x512.png',
    navbar: {
      title: 'CodeXplain',
      logo: {
        alt: 'CodeXplain Logo',
        src: 'img/android-chrome-192x192.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://github.com/nanaagyei/code-explain',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/getting-started/introduction',
            },
            {
              label: 'Features',
              to: '/docs/features/ai-documentation',
            },
            {
              label: 'API Reference',
              to: '/docs/api/backend-api',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/nanaagyei/code-explain',
            },
            {
              label: 'Discord',
              href: 'https://discord.gg/codeexplain',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Development',
              to: '/docs/development/architecture',
            },
            {
              label: 'Troubleshooting',
              to: '/docs/troubleshooting/common-issues',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} CodeXplain. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['python', 'typescript', 'javascript', 'json', 'bash'],
    },
    algolia: {
      // The application ID provided by Algolia
      appId: 'YOUR_APP_ID',
      // Public API key: it is safe to commit it
      apiKey: 'YOUR_SEARCH_API_KEY',
      indexName: 'codeexplain',
      // Optional: see doc section below
      contextualSearch: true,
      // Optional: Specify domains where the navigation should occur through window.location instead on history.push. Useful when our Algolia config crawls multiple documentation sites and we want to navigate with window.location.href to them.
      externalUrlRegex: 'external\\.com|domain\\.com',
      // Optional: Replace parts of the item URLs from Algolia. Useful when using the same search index for multiple deployments using a different baseUrl. You can use regexp or string in the `replace` method.
      replaceSearchResultPathname: {
        from: '/docs/', // or as RegExp: /\/docs\//
        to: '/',
      },
      // Optional: see doc section below
      searchParameters: {},
      // Optional: see doc section below
      searchPagePath: 'search',
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
