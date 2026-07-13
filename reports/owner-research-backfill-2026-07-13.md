# Owner research backfill — 2026-07-13

## Run summary

- Production inventory before the run: 41 boards, 33 with owner estimates, 8 without.
- Approved budget: at most 8 paid Gemini calls.
- Actual usage: 8 Gemini calls; 0 GLM calls; 0 TwitterAPI calls; 0 retries.
- Provider result: all 8 calls returned a positive range with Google Search grounding.
- Publication state: **none of these results has been added to a board or production.**
- Safety: no private location field was retained or included in this report.

The raw Gemini ranges are research candidates, not automatically publishable findings. Manual review below separates corroborated identity and company facts from inferred ownership, compensation, carried interest, and transaction proceeds.

## Results and review

| Board | Gemini range | Gemini confidence | Review disposition | Evidence assessment |
| --- | ---: | --- | --- | --- |
| `@crystalhuang` — Crystal Huang | $5M–$15M | medium | Hold | GV confirms she is a General Partner with a decade in venture investing. No public source found for her compensation, carry ownership, realized proceeds, or personal assets; the range is based on generalized partner economics. |
| `@cshorten30` — Connor Shorten | $300K–$1.5M | low | Reject for now | Weaviate corroborates his research/product role. No public evidence found for an equity grant, ownership percentage, liquidity, or personal assets. Company valuation plus assumed employee equity is too weak by itself. |
| `@ericzelikman` — Eric Zelikman | $224M–$672M | medium | Candidate, needs wider/low-confidence treatment | Humans&'s $480M seed round at a reported $4.48B valuation and Zelikman's co-founder role are corroborated. The 5%–15% personal stake used to derive the range is an inference, not a disclosed holding, and may not reflect dilution or restrictions. |
| `@jumbld` — Rohit Agarwal | $15M–$40M | medium | Candidate, low confidence | Palo Alto Networks confirms its acquisition of Portkey and Agarwal's co-founder/CEO role. A secondary report estimates the deal at $120M–$140M, but official terms and Agarwal's ownership or proceeds are undisclosed. |
| `@mathemagic1an` — Jay Hack | $15M–$40M | medium | Hold | Hack's own site and ClickUp confirm Codegen's acquisition; his earlier Mira Beauty exit is also reported. Codegen's financial terms were undisclosed, so the range cannot be tied to a known payout or ownership percentage. |
| `@nathanbenaich` — Nathan Benaich | $30M–$120M | medium | Hold | Air Street confirms a $232M Fund III and Benaich's solo-GP role. Assets under management are not personal wealth; management fees, carry ownership, fund performance, and realized proceeds are not publicly quantified. |
| `@saivc_` — Sai Senthilkumar | $2M–$10M | low | Hold | Redpoint corroborates his Partner role and investment career. No public evidence found for compensation, carried interest, realized gains, or personal assets. |
| `@swyx` — Shawn Wang | $20M–$60M | medium | Hold | Wang's own account confirms he joined Cognition and that most of Smol AI joined as part of the deal. The consideration, his proceeds, and his ownership were not disclosed; Cognition's company valuation is not a defensible proxy for his payout. |

## Durable source set

- Crystal Huang: [GV — New General Partners](https://www.gv.com/news/new-general-partners)
- Connor Shorten: [Weaviate — Authors](https://weaviate.io/papers/authors)
- Eric Zelikman: [TechCrunch — Humans& funding and valuation](https://techcrunch.com/2026/01/20/humans-a-human-centric-ai-startup-founded-by-anthropic-xai-google-alums-raised-480m-seed-round/)
- Rohit Agarwal: [Palo Alto Networks — Portkey acquisition](https://www.paloaltonetworks.com/company/press/2026/palo-alto-networks-completes-acquisition-of-portkey-to-secure-ai-agents), [TechTimes — reported deal estimate](https://www.techtimes.com/articles/317470/20260531/enterprise-ai-agent-stack-takes-shape-asana-palo-alto-buy-execution-security-layers.htm)
- Jay Hack: [Jay Hack — personal site](https://www.jay.ai/), [Business Wire — ClickUp acquisition](https://www.businesswire.com/news/home/20251223327889/en/ClickUp-Acquires-Cursor-Competitor-Codegen-to-Supercharge-AI-Super-Agents), [Dealroom — Mira Beauty](https://app.dealroom.co/companies/mira_beauty)
- Nathan Benaich: [Air Street Capital](https://www.airstreet.com/)
- Sai Senthilkumar: [Redpoint profile](https://www.redpoint.com/our-people/sai-senthilkumar/)
- Shawn Wang: [swyx — Cognition deal](https://swyx.io/cognition)

## Recommended product work

1. Store an explicit owner-research status such as `researched`, `no_public_basis`, `provider_error`, `parse_error`, or `not_run`; do not collapse every outcome to `null`.
2. Show `Owner estimate unavailable` when a board has no defensible owner range.
3. Add a review gate before owner estimates enter production: verified identity, durable citation, explicit wealth mechanism, wide labeled range, and confidence no higher than the evidence supports.
4. Resolve Gemini grounding redirects to durable source URLs before publication.
5. Backfill only approved candidates; leave held/rejected boards honest rather than forcing complete-looking data.

## Owner decision and prepared estimates

After reviewing the evidence limitations, the owner directed the project to use its best estimates for all eight boards and accepted that the guesses may be wrong. The review warnings above remain part of the audit trail. Every prepared entry is therefore marked **low confidence**, keeps a wide range, and states the inferred wealth mechanism rather than implying a disclosed holding.

| Board | Prepared low-confidence estimate |
| --- | ---: |
| `@crystalhuang` | $5M–$15M |
| `@cshorten30` | $300K–$1.5M |
| `@ericzelikman` | $200M–$700M |
| `@jumbld` | $15M–$40M |
| `@mathemagic1an` | $15M–$40M |
| `@nathanbenaich` | $30M–$120M |
| `@saivc_` | $2M–$10M |
| `@swyx` | $20M–$60M |

These values are prepared locally and are not live until the static-board deploy and dynamic-volume backfill are separately approved and completed.
