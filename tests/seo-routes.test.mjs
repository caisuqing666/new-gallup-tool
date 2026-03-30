import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const robotsPath = path.join(root, 'app', 'robots.ts');
const sitemapPath = path.join(root, 'app', 'sitemap.ts');

assert.equal(
  fs.existsSync(robotsPath),
  true,
  'Expected gallup-tool to provide app/robots.ts',
);

assert.equal(
  fs.existsSync(sitemapPath),
  true,
  'Expected gallup-tool to provide app/sitemap.ts',
);

const robotsSource = fs.readFileSync(robotsPath, 'utf8');
const sitemapSource = fs.readFileSync(sitemapPath, 'utf8');

assert.match(
  robotsSource,
  /gallup-tool\.com/,
  'Expected robots.ts to point to gallup-tool.com',
);

assert.match(
  sitemapSource,
  /gallup-tool\.com/,
  'Expected sitemap.ts to point to gallup-tool.com',
);

console.log('gallup seo routes ok');
