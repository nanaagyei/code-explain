import { exec } from 'child_process';
import { CodeXplainClient } from '../api/client';
import { getApiToken, getApiBaseUrl } from './auth';
import { formatError } from '../output/formatters';

export interface OpenOptions {
  urlOnly: boolean;
}

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  dim: '\x1b[90m'
};

export async function openRepository(repoId: string, options: OpenOptions): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const token = getApiToken();

  if (!token) {
    console.error(formatError('No API token configured. Run: codexplain config set-key <your-token>'));
    process.exit(1);
  }

  // Parse repo ID
  const id = parseInt(repoId, 10);
  if (isNaN(id)) {
    console.error(formatError(`Invalid repository ID: ${repoId}`));
    process.exit(1);
  }

  const client = new CodeXplainClient(baseUrl, token);

  try {
    // Verify repository exists
    const detail = await client.getRepository(id);
    const repo = detail.repository;

    // Construct web app URL
    // The web app URL is typically the API URL without /api or on a different port
    const webAppUrl = getWebAppUrl(baseUrl);
    const repositoryUrl = `${webAppUrl}/repositories/${repo.id}`;

    if (options.urlOnly) {
      console.log(repositoryUrl);
      return;
    }

    console.log(`${colors.cyan}Repository:${colors.reset} ${repo.name}`);
    console.log(`${colors.cyan}Status:${colors.reset}     ${repo.status}`);
    console.log(`${colors.cyan}URL:${colors.reset}        ${repositoryUrl}`);
    console.log('');

    // Open in browser
    console.log(`${colors.dim}Opening in browser...${colors.reset}`);
    
    await openBrowser(repositoryUrl);
    
    console.log(`${colors.green}✓${colors.reset} Opened in default browser`);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to open repository';
    console.error(formatError(message));
    process.exit(1);
  }
}

function getWebAppUrl(apiBaseUrl: string): string {
  // Common patterns:
  // http://localhost:8000 -> http://localhost:3000 (typical dev setup)
  // https://api.codexplain.dev -> https://app.codexplain.dev
  // https://codexplain.dev/api -> https://codexplain.dev

  try {
    const url = new URL(apiBaseUrl);
    
    // If localhost with port 8000, assume frontend is on 3000
    if (url.hostname === 'localhost' && url.port === '8000') {
      url.port = '3000';
      return url.origin;
    }

    // If API subdomain, switch to app subdomain
    if (url.hostname.startsWith('api.')) {
      url.hostname = url.hostname.replace('api.', 'app.');
      return url.origin;
    }

    // If /api path, remove it
    if (url.pathname.includes('/api')) {
      url.pathname = url.pathname.replace('/api', '');
      return url.origin;
    }

    // Default: use same origin
    return url.origin;
  } catch {
    // Fallback
    return apiBaseUrl.replace(':8000', ':3000').replace('/api', '');
  }
}

async function openBrowser(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const platform = process.platform;
    let command: string;

    switch (platform) {
      case 'darwin': // macOS
        command = `open "${url}"`;
        break;
      case 'win32': // Windows
        command = `start "" "${url}"`;
        break;
      default: // Linux and others
        // Try xdg-open first, then fallback to sensible-browser
        command = `xdg-open "${url}" || sensible-browser "${url}" || x-www-browser "${url}"`;
        break;
    }

    exec(command, (error) => {
      if (error) {
        // Don't fail completely - the URL was still printed
        console.error(`${colors.dim}Could not open browser automatically. Please open the URL manually.${colors.reset}`);
        resolve();
      } else {
        resolve();
      }
    });
  });
}
