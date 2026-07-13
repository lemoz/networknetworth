#!/usr/bin/env node

// Bounded, review-first owner research for the eight production boards that
// currently lack meta.owner. This tool calls Gemini directly so GLM and
// TwitterAPI cannot be used as implicit fallbacks. It prints results to stdout
// and never edits a board or production data.

import { researchOwnerGemini } from '../gemini.mjs';

const ORIGIN = process.env.PUBLIC_ORIGIN || 'https://networknetworth.fly.dev';
const MAX_CALLS = 8;
const HANDLES = [
  'crystalhuang',
  'cshorten30',
  'ericzelikman',
  'jumbld',
  'mathemagic1an',
  'nathanbenaich',
  'saivc_',
  'swyx',
];
const DRY_RUN = process.argv.includes('--dry-run');

function safeError(error) {
  return String(error && error.message || error || 'unknown error')
    .replace(/key=[^&\s]+/gi, 'key=[redacted]')
    .slice(0, 300);
}

function validateOwner(owner) {
  if (!owner) return { status: 'no_result', reason: 'Gemini returned no usable owner result.' };
  if (!(Number.isFinite(owner.low) && owner.low > 0 && Number.isFinite(owner.high) && owner.high > 0)) {
    return { status: 'rejected', reason: 'The returned range did not contain two positive dollar values.' };
  }
  if (owner.low > owner.high) return { status: 'rejected', reason: 'The returned low value exceeded the high value.' };
  const sources = Array.isArray(owner.sources) ? owner.sources : [];
  const evidenceSources = sources.filter((url) => !/^https:\/\/(?:www\.)?x\.com\//i.test(url));
  if (owner.verdict !== 'web-researched' || evidenceSources.length === 0) {
    return { status: 'rejected', reason: 'The result did not include grounded non-X source citations.' };
  }
  return { status: 'researched', owner: { ...owner, sources } };
}

async function readBoard(handle) {
  const response = await fetch(`${ORIGIN}/research/${encodeURIComponent(handle)}.json`, { redirect: 'error' });
  if (!response.ok) throw new Error(`board ${handle} returned HTTP ${response.status}`);
  const data = await response.json();
  if (!data || !data.meta || !data.meta.account) throw new Error(`board ${handle} returned invalid metadata`);
  return data;
}

const boards = [];
for (const handle of HANDLES) boards.push(await readBoard(handle));

const inventory = boards.map((board, index) => ({
  handle: HANDLES[index],
  name: board.meta.name || `@${HANDLES[index]}`,
  followers: Number(board.meta.totalFollowers) || 0,
  dynamic: !!board.meta.dynamic,
  alreadyHasOwner: !!board.meta.owner,
}));

if (DRY_RUN) {
  console.log(JSON.stringify({ mode: 'dry-run', maxCalls: MAX_CALLS, inventory }, null, 2));
  process.exit(0);
}

if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is required');

let calls = 0;
const results = [];
for (const item of inventory) {
  if (item.alreadyHasOwner) {
    results.push({ ...item, status: 'skipped', reason: 'The production board already has an owner estimate.' });
    continue;
  }
  if (calls >= MAX_CALLS) throw new Error(`approved Gemini call cap of ${MAX_CALLS} reached`);
  calls += 1;
  console.error(`[${calls}/${MAX_CALLS}] Researching @${item.handle}`);
  try {
    const owner = await researchOwnerGemini({
      userName: item.handle,
      name: item.name,
      followers: item.followers,
      description: '',
      location: '',
      link: `https://x.com/${item.handle}`,
    });
    results.push({ ...item, call: calls, ...validateOwner(owner) });
  } catch (error) {
    results.push({ ...item, call: calls, status: 'provider_error', reason: safeError(error) });
  }
}

const counts = results.reduce((all, result) => {
  all[result.status] = (all[result.status] || 0) + 1;
  return all;
}, {});

console.log(JSON.stringify({
  generatedAt: new Date().toISOString(),
  origin: ORIGIN,
  approvedCallCap: MAX_CALLS,
  callsMade: calls,
  retryPolicy: 'No retries or fallback calls beyond the approved eight-call cap.',
  counts,
  results,
}, null, 2));
