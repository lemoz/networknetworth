#!/usr/bin/env node

// Apply the reviewed owner estimates in tools/owner_worths.json to the seven
// dynamic boards stored on Fly's durable volume. Dry-run is the default. The
// script refuses to overwrite an existing owner and writes each board atomically.

import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OWNERS = JSON.parse(readFileSync(join(ROOT, 'tools', 'owner_worths.json'), 'utf8'));
const HANDLES = [
  'crystalhuang',
  'cshorten30',
  'ericzelikman',
  'jumbld',
  'mathemagic1an',
  'nathanbenaich',
  'saivc_',
];
const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const dirIndex = args.indexOf('--dir');
const BOARDS_DIR = dirIndex >= 0 ? args[dirIndex + 1] : join(ROOT, '.data', 'boards');
const ORIGIN = process.env.PUBLIC_ORIGIN || 'https://networknetworth.fly.dev';

function reviewedOwner(handle) {
  const source = OWNERS[handle];
  if (!source || source.found === false) throw new Error(`missing reviewed owner for @${handle}`);
  if (!(source.low > 0 && source.high > 0 && source.low <= source.high)) throw new Error(`invalid owner range for @${handle}`);
  if (source.confidence !== 'low') throw new Error(`backfill owner @${handle} must remain low confidence`);
  const sources = Array.isArray(source.sources) ? source.sources.filter((url) => /^https?:\/\//i.test(url)) : [];
  if (sources.length === 0) throw new Error(`missing source URLs for @${handle}`);
  return {
    name: source.name || `@${handle}`,
    headline: String(source.headline || '').slice(0, 240),
    verdict: source.verdict || 'plausible',
    confidence: 'low',
    low: Math.round(source.low),
    high: Math.round(source.high),
    sources: sources.slice(0, 5),
    engine: 'gemini-flash-latest + manual source review',
  };
}

async function loadBoard(handle) {
  const file = join(BOARDS_DIR, `${handle}.json`);
  if (existsSync(file)) return { file, data: JSON.parse(readFileSync(file, 'utf8')), remotePreview: false };
  if (WRITE) throw new Error(`board file not found: ${file}`);
  const response = await fetch(`${ORIGIN}/research/${handle}.json`, { redirect: 'error' });
  if (!response.ok) throw new Error(`production preview for @${handle} returned HTTP ${response.status}`);
  return { file, data: await response.json(), remotePreview: true };
}

const results = [];
for (const handle of HANDLES) {
  const owner = reviewedOwner(handle);
  const { file, data, remotePreview } = await loadBoard(handle);
  if (!data.meta || String(data.meta.account || '').toLowerCase() !== handle) throw new Error(`board identity mismatch for @${handle}`);
  if (data.meta.owner) {
    results.push({ handle, status: 'already_present', file, remotePreview });
    continue;
  }
  if (WRITE) {
    data.meta.owner = owner;
    const temporary = `${file}.${process.pid}.tmp`;
    writeFileSync(temporary, JSON.stringify(data, null, 1));
    renameSync(temporary, file);
  }
  results.push({
    handle,
    status: WRITE ? 'written' : 'planned',
    file,
    remotePreview,
    range: { low: owner.low, high: owner.high },
    confidence: owner.confidence,
    sources: owner.sources.length,
  });
}

console.log(JSON.stringify({ mode: WRITE ? 'write' : 'dry-run', boardsDir: BOARDS_DIR, results }, null, 2));
