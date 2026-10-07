# Rarewood foundation — October 7, 2026

## Isolation checkpoint

Bulk Ag source baseline: `9469f56b650176c7e651aee59cb8534fdbc39d0d`.
Bulk Ag GitHub archive remains in Eric-Crews/bulk-ag. No writes to its source, database, environment, domain, or live deployment are part of this fork.
Rarewood source: Eric-Crews/rarewood. The distinct project ID is recorded in `.openai/hosting.json`.

## Catalog basis and clarification

The initial product/type list was informed by Scrounger's Paradise's public product pages for exotic wood, decking, flooring, slabs, and plywood. Public listing does not establish current quantity, price, origin, certification, or shipping availability. No supplier price or inventory count was imported.

Trade names are preserved as aliases only where reasonably clear. Botanical identities are intentionally not inferred. Cachichira remains in Future products: its spelling and species identity should be confirmed with the supplier before publication. Several other unclear trade names were excluded from the starter catalog.

Public reference pages:
- https://scroungersparadise.com/our-products/
- https://scroungersparadise.com/portfolio-item/exotic-wood/

The initial supplier contact is internal and editable. Commission terms, accepted quote scope, payment responsibilities, freight arrangements, and actual availability must be agreed with the selected supply partner.

## Graph and publishing

Species → product forms → product guides → three supporting Insights.
Categories, tags, and topics connect shared products and related articles. All content uses one structured model, retaining the established editorial page components. A product can be published without claiming inventory. An Insight requires a published primary product. Planned briefs cannot accidentally publish as full articles.

Batch generation runs serially from admin: one response is validated and saved before the next request. Published/manual content is preserved; optimistic concurrency checks protect changes made while generation is in flight. No GitHub Actions are involved.

## Next content pass

Review the private starter guides, then connect a dedicated OpenAI key to expand individual pages and their topic plans. Check technical claims and species naming against supplier documentation before public release. Add actual lot photographs and dimensions separately from evergreen page illustrations.
