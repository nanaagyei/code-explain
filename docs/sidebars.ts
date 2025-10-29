import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/introduction',
        'getting-started/installation',
        'getting-started/quick-start',
        'getting-started/configuration',
      ],
    },
    {
      type: 'category',
      label: 'Features',
      items: [
        'features/ai-documentation',
        'features/ai-code-review',
        'features/quality-metrics',
        'features/architecture-diagrams',
        'features/ai-mentor',
        'features/bulk-operations',
        'features/github-integration',
        'features/custom-prompts',
        'features/api-key-management',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api/backend-api',
        'api/frontend-api',
        'api/authentication',
        'api/rate-limiting',
      ],
    },
    {
      type: 'category',
      label: 'Development',
      items: [
        'development/architecture',
        'development/contributing',
        'development/testing',
        'development/deployment',
      ],
    },
    {
      type: 'category',
      label: 'Troubleshooting',
      items: [
        'troubleshooting/common-issues',
        'troubleshooting/performance',
        'troubleshooting/debugging',
      ],
    },
  ],
};

export default sidebars;
