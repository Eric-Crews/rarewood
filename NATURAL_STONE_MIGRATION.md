# Natural Stone Exchange — isolated starter branch

This branch adapts the Rarewood Exchange source as a starting point for **naturalstone.exchange**. It is **not yet a deployable, production-ready Natural Stone Exchange application**.

## Source catalog
Use the generated `natural_stone_exchange_catalog_v1.zip` package from this conversation as the import source. It contains 13 material families, 110 stone varieties, 54 product forms, 200 master products, a PostgreSQL schema, and internal-link plan. The ZIP is **not committed to this repository**.

## Required before creating the independent Sites project
1. Create a **new** GitHub repository from this branch's source, not another branch deployed to Rarewood's production project.
2. Create **new** Sites project with its own D1 DB and R2 bucket. This branch intentionally removes the original `project_id` from `.openai/hosting.json`; do not restore Rarewood's identifier.
3. Import the normalized stone families, varieties, forms, and product records into a fresh schema; replace all Rarewood wood seeds, wood-specific data models, pages, illustrations, and OpenAI prompts. Never point to Rarewood's DB or storage.
4. Build canonical routes `/stone/[family]/[variety]`, `/products/[slug]`, `/applications/[slug]`, `/guides/[slug]`, and `/suppliers/[region]`. Product routes must be unique, structured, and linked to a primary family hub.
5. Create product-specific RFQs with stone, grade, thickness, finish, quantity, pricing unit, project location, schedule; preserve supplier handoff and manual invoice/commission tracking.
6. Add 3 relevant editorial spokes per product after editorial review, linking directly to the matching canonical product page. Keep both spokes and products unpublished/noindex until substantive original content exists.
7. Require supplier-verified inventory before showing stock, origins, pricing, images or specific lots; do not misclassify engineered materials as natural stone.
8. Reconfigure all secrets, admin controls, email, analytics, branding, sitemap, canonical URL `https://naturalstone.exchange`, favicon and legal pages.
9. Run TS typechecking, build, isolated DB migration tests, product/RFQ flows and no-cross-project-data regression checks.

## Current scope
This branch only begins the branding transition (site metadata, homepage, navigation/footer) and removes the Rarewood Sites project ID. The inherited wood catalog and workflows **still require refactoring before deployment**. Do not merge this branch into Rarewood's `main`.
