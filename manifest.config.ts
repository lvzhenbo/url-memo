import { defineManifest } from '@crxjs/vite-plugin';
import packageJson from './package.json';
const { version } = packageJson;
const [major, minor, patch, label = '0'] = version.replace(/[^\d.-]+/g, '').split(/[.-]/);

export default defineManifest(async () => ({
  manifest_version: 3,
  name: 'URL 备忘录',
  version: `${major}.${minor}.${patch}.${label}`,
  version_name: version,
  description: '一个简单的URL备忘录，用于临时记录的URL，方便快速打开',
  icons: {
    '16': 'src/assets/16.png',
    '32': 'src/assets/32.png',
    '48': 'src/assets/48.png',
    '128': 'src/assets/128.png',
  },
  action: { default_popup: 'index.html' },
  permissions: ['tabs', 'storage'],
}));
