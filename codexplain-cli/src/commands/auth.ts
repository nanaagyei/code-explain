import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.codexplain');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

export interface Config {
  apiToken?: string;
  apiBaseUrl?: string;
}

function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function readConfig(): Config {
  if (!fs.existsSync(CONFIG_PATH)) {
    return {};
  }
  try {
    const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(content) as Config;
  } catch {
    return {};
  }
}

function writeConfig(config: Config): void {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export function setApiKey(key: string): void {
  if (!key || !key.trim()) {
    console.error('Error: API key is required.');
    process.exit(1);
  }

  const config = readConfig();
  config.apiToken = key.trim();
  writeConfig(config);
  console.log('✓ API key saved to ~/.codexplain/config.json');
}

export function setApiUrl(url: string): void {
  if (!url || !url.trim()) {
    console.error('Error: API URL is required.');
    process.exit(1);
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    console.error('Error: Invalid URL format.');
    process.exit(1);
  }

  const config = readConfig();
  config.apiBaseUrl = url.trim().replace(/\/$/, ''); // Remove trailing slash
  writeConfig(config);
  console.log(`✓ API URL set to: ${config.apiBaseUrl}`);
}

export function getApiToken(): string | null {
  const config = readConfig();
  return config.apiToken || null;
}

export function getApiBaseUrl(): string {
  const envUrl = process.env.CODEXPLAIN_API_BASE_URL;
  if (envUrl) {
    return envUrl;
  }
  const config = readConfig();
  return config.apiBaseUrl || 'http://localhost:8000';
}

export function showConfig(): void {
  const config = readConfig();
  console.log('\nCodeXplain Configuration');
  console.log('========================');
  console.log(`Config file: ${CONFIG_PATH}`);
  console.log(`API URL: ${config.apiBaseUrl || '(not set, using default: http://localhost:8000)'}`);
  console.log(`API Key: ${config.apiToken ? '****' + config.apiToken.slice(-4) : '(not set)'}`);
  console.log(`\nEnvironment overrides:`);
  console.log(`CODEXPLAIN_API_BASE_URL: ${process.env.CODEXPLAIN_API_BASE_URL || '(not set)'}`);
}
