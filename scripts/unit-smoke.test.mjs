import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('web package smoke', () => {
  it('exposes required package scripts', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    assert.equal(typeof pkg.scripts.build, 'string');
    assert.equal(typeof pkg.scripts.test, 'string');
    assert.equal(typeof pkg.scripts.lint, 'string');
  });

  it('ships analytics insights module', () => {
    const src = readFileSync(join(root, 'src/lib/analytics-insights.ts'), 'utf8');
    assert.match(src, /export function parseAiReportBody/);
    assert.match(src, /export function scoringModeLabel/);
  });
});
