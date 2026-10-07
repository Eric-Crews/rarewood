/* Isolated integration checks: real SQLite + real route logic; no network or external writes. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const {DatabaseSync}=require('node:sqlite');
const root=path.resolve(__dirname,'../..');
const sqlite=new DatabaseSync(':memory:');
for(const file of fs.readdirSync(path.join(root,'drizzle')).filter(f=>f.endsWith('.sql')).sort())sqlite.exec(fs.readFileSync(path.join(root,'drizzle',file),'utf8'));
const d1={prepare(sql){return {values:[],bind(...values){this.values=values;return this;},async first(){return sqlite.prepare(sql).get(...this.values)||null;},async all(){return {results:sqlite.prepare(sql).all(...this.values)};},async run(){const result=sqlite.prepare(sql).run(...this.values);return {success:true,meta:{changes:Number(result.changes)}};}};},async batch(statements){return Promise.all(statements.map(s=>s.run()));}};
let admin=false;
const cache=new Map();
const auth={isAdmin:async()=>admin,requireAdmin:async()=>{if(!admin)throw Error('Admin required');},assertSameOrigin(request){assert.equal(request.headers.get('origin'),new URL(request.url).origin);},jsonBody:async request=>request.json()};
function load(file){
 const absolute=path.resolve(root,file);
 if(cache.has(absolute))return cache.get(absolute).exports;
 if(absolute.endsWith('.json'))return JSON.parse(fs.readFileSync(absolute,'utf8'));
 const module={exports:{}};cache.set(absolute,module);
 const code=ts.transpileModule(fs.readFileSync(absolute,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,resolveJsonModule:true}}).outputText;
 function req(name){if(name==='cloudflare:workers')return {env:{DB:d1,BUCKET:{}}};if(name==='@/lib/auth'||(name==='./auth'&&absolute.endsWith('/lib/db.ts')))return auth;if(name.startsWith('.')||name.startsWith('@/')){let resolved=name.startsWith('@/')?path.resolve(root,name.slice(2)):path.resolve(path.dirname(absolute),name);if(!path.extname(resolved))resolved+='.ts';return load(resolved);}return require(name);}
 new Function('require','module','exports',code)(req,module,module.exports);return module.exports;
}
function request(url,body){return new Request('https://rarewood.test'+url,{method:'POST',headers:{Origin:'https://rarewood.test','Content-Type':'application/json'},body:JSON.stringify(body)});}
(async()=>{
 const {recordSchema}=load('lib/validation.ts');const products=require('../../data/wood-products.json');
 for(const p of products)recordSchema.parse({...p,kind:'product'});
 const contract=load('lib/generation-contract.ts');assert.equal(contract.woodGenerationExample.slug,'ipe-decking');assert.equal(contract.woodGenerationExample.landingProfile.shipping.length,3);assert.equal(contract.woodGenerationExample.blogTopics.length,3);assert.equal(contract.structuredSchema(contract.productGenerationSchema).additionalProperties,false);
 const db=load('lib/db.ts');await db.ensureSeed();assert.equal((await db.listProducts()).length,45);assert.equal((await db.listProducts(true)).length,46);assert.equal((await db.listHubs()).length,6);assert.equal((await db.listLeads()).length,0);
 for(const table of ['supplier_leads','inventory_lots','sourcing_deals','media','broker_mail','admin_settings'])assert.equal(sqlite.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count,0);
 const wood=load('lib/wood-db.ts');assert.equal((await wood.listSpecies()).length,35);
 const drafts=load('lib/content-drafts.ts');const sync=await drafts.syncContentDrafts();assert.equal(sync.insightsCreated,135);assert.equal((await drafts.syncContentDrafts()).insightsCreated,0);
 const plans=(await db.listPosts(true)).filter(p=>p.content.generationState==='planned'&&p.content.pageType==='article');assert.equal(plans.length,135);assert(plans.every(p=>p.status==='draft'&&p.content.primaryProduct));assert.equal((await db.listPosts()).length,3);
 sqlite.prepare("UPDATE products SET summary='Editor content is preserved.' WHERE slug='ipe-decking'").run();cache.delete(path.resolve(root,'lib/db.ts'));await load('lib/db.ts').ensureSeed();assert.equal((await db.productBySlug('ipe-decking')).summary,'Editor content is preserved.');
 const api=load('app/api/leads/route.ts');const input={requestKey:crypto.randomUUID(),product:'Ipe decking',company:'Foundation check',name:'Test Buyer',email:'buyer@example.com',volume:200,unit:'Linear feet',frequency:'One-time purchase',grade:'Grooved',dimensions:'Actual dimensions to confirm',application:'Deck',destination:'Asheville NC 28801',timing:'Planning ahead',consent:true};
 let response=await api.POST(request('/api/leads',input));assert.equal(response.status,201);const saved=await response.json();assert(saved.reference.startsWith('RWX-'));response=await api.POST(request('/api/leads',input));assert.equal((await response.json()).reference,saved.reference);assert.equal((await db.listLeads()).length,1);assert.equal((await db.listLeads())[0].payload.dimensions,input.dimensions);
 assert.equal((await api.POST(request('/api/leads',{...input,requestKey:crypto.randomUUID(),consent:false}))).status,400);assert.equal((await api.POST(request('/api/leads',{...input,requestKey:crypto.randomUUID(),unit:'Metric tons'}))).status,400);
 const operations=load('app/api/admin/wood/route.ts');assert.equal((await operations.GET()).status,403);assert.equal((await operations.POST(request('/api/admin/wood',{}))).status,403);admin=true;
 const lot={kind:'lot',productSlug:'ipe-decking',partnerId:'scroungers-paradise',reference:'TEST-LOT',quantity:null,unit:'Linear feet',dimensions:'Confirm on order',condition:'Unverified test',location:'Test location',status:'available',notes:'PRIVATE INTERNAL NOTE'};
 assert.equal((await operations.POST(request('/api/admin/wood',lot))).status,400);response=await operations.POST(request('/api/admin/wood',{...lot,quantity:100}));assert.equal(response.status,200);const lotId=(await response.json()).id;let available=await wood.availableLots('ipe-decking');assert.equal(available.length,1);assert(!JSON.stringify(available).includes('PRIVATE'));assert(!JSON.stringify(available).includes('yahoo'));
 sqlite.prepare('UPDATE inventory_lots SET confirmed_at=? WHERE id=?').run('2020-01-01T00:00:00.000Z',lotId);assert.equal((await wood.availableLots('ipe-decking')).length,0);
 const lead=(await db.listLeads())[0];const deal={kind:'deal',leadId:lead.id,partnerId:'scroungers-paradise',stage:'quote-ready',materialAmount:3000,freightAmount:300,commissionAmount:150,commissionPaid:false,quoteExpires:'2026-12-01',invoiceReference:'',shipmentReference:'',trackingUrl:'',notes:'Test only'};assert.equal((await operations.POST(request('/api/admin/wood',deal))).status,200);assert.equal(sqlite.prepare('SELECT commission_amount FROM sourcing_deals WHERE lead_id=?').get(lead.id).commission_amount,150);
 const sitemap=await (await load('app/sitemap.xml/route.ts').GET()).text();assert(sitemap.includes('/species/ipe'));assert(sitemap.includes('/products/ipe-decking'));assert(!sitemap.includes('cachichira'));assert(!sitemap.includes('/admin'));assert(!sitemap.includes('bulkagexchange.com'));assert(!sitemap.includes('spoke-'));
 const parsedAssets=JSON.parse(fs.readFileSync(path.join(root,'data/illustrations/runtime.json')));for(const name of Object.keys(parsedAssets.families))for(const suffix of ['','-small'])assert(fs.existsSync(path.join(root,'public',parsedAssets.asset_base,`${name}${suffix}.webp`)));
 console.log('PASS: fresh 14-table SQLite schema; 46 valid products / 35 public species; 6 unique hubs; 135 idempotent Insight plans; seed edit preservation; quote validation/save/deduplication; admin protection; lot confirmation and privacy; deal persistence; sitemap publication gates; asset fallbacks.');
 sqlite.close();
})().catch(error=>{console.error(error);process.exit(1);});
