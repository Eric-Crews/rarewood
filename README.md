# Rarewood Exchange

Independent specialty lumber sourcing, operated by AdvGuides, LLC. Domain: rarewoodexchange.com.

This is a **separate application**, derived from a source snapshot of Bulk Ag Exchange. It does not connect to Bulk Ag's database, media bucket, credentials, analytics, leads, or production deployment.

## Content and data

- 46 starter product records across exotic lumber, decking, flooring, slabs, and plywood. 45 guides are available in the private preview; Cachichira slabs remain a future/draft product pending identity clarification.
- 36 wood species records (35 published, one awaiting clarification). Each species links to its product forms.
- Six collection hubs: the wood-products parent and five product categories. Category scopes are unique.
- Three original starter Insights. Each approved product contains three distinct supporting article plans: specifications, applications, and logistics. Opening the admin synchronizes missing plans into drafts without replacing edited content.
- JSON content owns the hero, facts, overview, benefits, specification table, applications, three ordering/delivery points, FAQs, related products, tags, topics, and SEO fields. React owns layout.
- `data/product-record.example.json` and `lib/generation-contract.ts` use Ipe decking as the concrete model response example. Zod and strict JSON Schema share the same limits.
- Product guides describe sourcing considerations, not confirmed stock. Supplier lots live separately and are public only when marked available with a quantity and confirmed within seven days.

## Independent storage

`.openai/hosting.json` belongs to Rarewood alone. Sites provisions its own D1 (`DB`) and R2 (`BUCKET`) resources. `drizzle/0000_plain_madame_web.sql` is a fresh initial schema; no agricultural migrations or production data were copied. Future schema changes use append-only Drizzle migrations.

The core entities are products, wood species, editorial posts/collections, buyer inquiries, supplier inquiries, supply partners, inventory lots, and sourcing deals. The new database starts without buyer leads, seller leads, inventory lots, quotes, payments, commissions, media, or email delivery records. One initial supply-partner contact is seeded for Scrounger's Paradise; that is an internal sourcing contact, not a claim that Rarewood is its DBA, owner, or exclusive representative.

Seeds use `INSERT OR IGNORE`; saved edits are not overwritten. Content generation merges the generated body into existing metadata, preserving species and product-form fields.

## Working routes

- `/products`, `/products/[slug]`: searchable directory and product sourcing pages.
- `/species`, `/species/[slug]`: species library and available product forms.
- `/collections`, `/collections/[slug]`: categories, tags, and topics.
- `/insights`, `/insights/[slug]`: paginated journal and product-linked articles.
- `/request`: buyer sourcing inquiries with dimensions, order units, intended use, destination, and timing.
- `/sell`, `/sell/[slug]`: private supplier inventory submissions.
- `/admin`: content editing, sequential generation, lead review/PDF export, and sourcing operations.
- `/sitemap.xml`, `/robots.txt`: published URLs; drafts and private admin/broker routes are excluded.

The admin uses server-verified ChatGPT identity plus an email allowlist. Optional password protection can be configured independently. Public endpoints cannot access leads, supplier contacts, quotes, or commissions.

Sourcing operations support supply-partner records, lot confirmation, partner assignment, quote components, commission tracking, supplier invoice references, and shipment/tracking references. These are manual commercial records: the app does not book freight, accept payments, or promise automatic Warp updates.

## Service setup

No previous API keys or OAuth settings were copied.

- OpenAI: a Rarewood server-side `OPENAI_API_KEY` enables generation, fixed to `gpt-6-luna`. Product, Insight, and taxonomy generation use structured responses without web-search tool calls. The admin remains usable for manual publishing while disconnected.
- Pexels: optional `PEXELS_API_KEY`. Local image uploads use Rarewood's own R2 bucket.
- Gmail: configure a new OAuth web client in admin with this site's origins. The lead composer selects an active supply partner and shows the recipient and PDF before sending. No email is sent by assigning a partner or saving a lead.
- Freight: Warp booking/integration is not connected. Record the agreed carrier reference and tracking URL manually.
- Domain: leave `SITE_URL` unset until DNS and the custom domain are ready. Then set `https://rarewoodexchange.com` for canonicals, sitemap URLs, and public GET/HEAD redirects. Preview defaults to Rarewood's native Sites URL.
- Analytics: no Bulk Ag measurement ID is installed.

## Images

`public/images/wood/` contains original illustrative workshop artwork and a reusable transparent lumber engraving, each in two WebP sizes. These are conceptual artwork, not photographs of supplier inventory or a representation of a particular species. Actual uploaded page images take priority on cards. `data/illustrations/runtime.json` is the reusable mapping/fallback layer. Generation prompts are recorded in `docs/wood-art-prompts.json`.

## Development and validation

Preserve pnpm and the lockfile. Use the Sites build and hosting helpers for this project. Never copy the Bulk Ag hosting manifest or runtime secrets here.

- Typecheck: `node node_modules/typescript/bin/tsc --noEmit`
- Foundation checks: `node scripts/checks/rarewood-foundation.cjs`
- Schema changes: `npm run db:generate`

The repository is `https://github.com/Eric-Crews/rarewood`. Bulk Ag remains in its original repository and hosting project.
