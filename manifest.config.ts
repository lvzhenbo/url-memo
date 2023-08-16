import { defineManifest } from '@crxjs/vite-plugin';
import packageJson from './package.json';
const { version } = packageJson;
const [major, minor, patch, label = '0'] = version.replace(/[^\d.-]+/g, '').split(/[.-]/);

export default defineManifest(async () => ({
  manifest_version: 3,
  name: 'URL 备忘录',
  version: `${major}.${minor}.${patch}.${label}`,
  version_name: version,
  action: { default_popup: 'index.html' },
  permissions: ['tabs', 'storage'],
}));
