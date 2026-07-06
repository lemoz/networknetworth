// GLM 5.2 research client (Z.ai / OpenAI-compatible chat completions).
// Used for on-demand board building: researches the account owner and their
// biggest sampled followers. Results are ALWAYS labeled ai-researched and
// unverified — they never enter the curated research/ dataset or the
// leaderboards until they pass the Sonnet verify gate offline.
//
//   .env: GLM_API_KEY   (required for on-demand research)
//         GLM_API_URL   (default https://api.z.ai/api/paas/v4/chat/completions)
//         GLM_MODEL     (default glm-5.2)

// Z.ai (GLM) — endpoint + auth confirmed against docs.z.ai (2026-07-05).
// Model id is 'glm-5' (the dashboard's "GLM-5.2" is branding, not an API id);
// 'glm-5-turbo' is the agent-loop variant. Override with GLM_MODEL.
const GLM_URL = process.env.GLM_API_URL || 'https://api.z.ai/api/paas/v4/chat/completions';
const GLM_MODEL = process.env.GLM_MODEL || 'glm-5';

export function glmAvailable() { return !!process.env.GLM_API_KEY; }

async function glmJSON(system, user, { maxTokens = 4000, timeoutMs = 180_000 } = {}) {
  const body = {
    model: GLM_MODEL,
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    response_format: { type: 'json_object' },
    max_tokens: maxTokens,
    temperature: 0.2,
  };
  // Z.ai supports a built-in web_search tool; try with it, retry without if the
  // endpoint rejects it (keeps us portable across OpenAI-compatible hosts).
  for (const tools of [[{ type: 'web_search', web_search: { enable: true } }], undefined]) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await fetch(GLM_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + process.env.GLM_API_KEY },
        body: JSON.stringify(tools ? { ...body, tools } : body),
        signal: ctrl.signal,
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j) { if (tools) continue; throw new Error('glm http ' + r.status + ': ' + JSON.stringify(j).slice(0, 200)); }
      const text = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
      if (!text) { if (tools) continue; throw new Error('glm empty response'); }
      const m = text.match(/\{[\s\S]*\}/);
      return JSON.parse(m ? m[0] : text);
    } catch (e) {
      if (!tools) throw e;
    } finally { clearTimeout(timer); }
  }
  throw new Error('glm unreachable');
}

const UNITS_RULE = 'All dollar amounts must be RAW US DOLLARS as JSON numbers: $2 billion = 2000000000, $50 million = 50000000. Never output 2 or 50 to mean billions/millions. If there is no credible public basis for an estimate, say found=false — never invent a number.';

// Research the board owner's own net worth, GROUNDED on their real X profile
// (self-reported location, bio, external link). profile: {userName, name,
// followers, description, location, link}. `link` should already be resolved
// (t.co -> real destination) by the caller.
export async function researchOwner(profile) {
  const loc = (profile.location || '').trim();
  const link = (profile.link || '').trim();
  const j = await glmJSON(
    'You are a careful wealth researcher. You are given a real X/Twitter profile. Identify who the person is (role, company, wealth basis) and estimate their personal net worth from what is publicly known about them. ' + UNITS_RULE +
    ' Do NOT invent a location, employer, or URL — only use what is given or what you actually know. Respond with JSON only: {"found":bool,"name":str,"role":str,"headline":str,"basis":str,"low":number,"high":number,"confidence":"low"|"medium"|"high"}. "role" = job title + company (from the bio/link if unclear). "basis" = one sentence on WHY this net-worth range (equity, exits, salary, or "no strong public basis").',
    `Real X profile:\n- Handle: @${profile.userName}\n- Name: ${profile.name}\n- Followers: ${(profile.followers || 0).toLocaleString()}\n- Bio: "${profile.description || 'n/a'}"\n- Self-reported location: ${loc || 'n/a'}\n- Linked site: ${link || 'n/a'}\n\nWho are they, and what is a defensible personal net worth range?`
  );
  if (!j || j.found === false || !(j.low > 0 || j.high > 0)) return null;
  // sources are REAL only: the person's X profile + their own linked site. We
  // never surface GLM-claimed citation URLs (it fabricates them without search).
  const sources = ['https://x.com/' + profile.userName];
  if (/^https?:\/\//i.test(link)) sources.push(link);
  return {
    name: j.name || profile.name,
    role: String(j.role || '').slice(0, 120),
    headline: String(j.headline || '').slice(0, 200),
    basis: String(j.basis || '').slice(0, 200),
    location: loc,                                   // echo REAL location, never GLM's
    verdict: 'ai-researched', confidence: j.confidence === 'high' ? 'medium' : 'low', // cap: unverified
    low: Math.round(j.low), high: Math.round(j.high),
    sources,
  };
}

// Research a batch of sampled followers (the biggest ones). One GLM call per
// person keeps failures isolated; the caller bounds N.
export async function researchPerson(f) {
  const j = await glmJSON(
    'You are a careful wealth researcher identifying whether a Twitter/X account belongs to a person with publicly estimable wealth. Use web search when available. Companies, brands, and anonymous accounts are NOT identifiable people: found=false. ' + UNITS_RULE + ' Respond with JSON only: {"found":bool,"name":str,"headline":str,"low":number,"high":number,"confidence":"low"|"medium"|"high","sources":[urls]}',
    `Who is X/Twitter user @${f.userName} ("${f.name}", ${(f.followers || 0).toLocaleString()} followers)? Bio: "${f.description || 'n/a'}". If they are an identifiable person, estimate their net worth range.`
  );
  if (!j || j.found === false || !(j.low > 0 || j.high > 0)) return null;
  return {
    handle: f.userName, name: j.name || f.name, followers: f.followers || 0, identified: true,
    headline: String(j.headline || '').slice(0, 200),
    verdict: 'ai-researched', confidence: j.confidence === 'high' ? 'medium' : 'low',
    low: Math.round(j.low), high: Math.round(j.high),
    sources: [], // GLM hallucinates URLs without live search — see researchOwner
  };
}
