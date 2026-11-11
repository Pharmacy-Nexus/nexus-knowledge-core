// Zero-dependency smoke test. Runs the existing app within a minimal DOM stub.
// No database, patient records or cloud credentials involved.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
assert(source.includes("const VAULT_BUCKET='vital-medical-vault'"));
assert(source.includes("state.tab==='vault'?renderVault()"));
assert(source.includes("auth:true"));
assert(source.includes("'GET','authenticated/'+VAULT_BUCKET"));
assert(source.includes("'POST',remote,file"));
assert(source.includes("'DELETE',VAULT_BUCKET"));
assert(!source.includes('object/public/'+'vital-medical-vault'));
const root={innerHTML:'',classList:{toggle(){}},addEventListener(){},querySelector(){return null;}};
const map=new Map();
const sandbox={
  window:{VITAL_CONFIG:{supabaseUrl:'https://demo.supabase.co',publishableKey:'sb_publishable_demo_for_test_only'}},
  document:{getElementById(id){return id==='app'?root:{textContent:'',classList:{add(){},remove(){}}}},documentElement:{},addEventListener(){}},
  localStorage:{getItem(){return null;},setItem(){}},sessionStorage:{getItem(){return null;},setItem(){},removeItem(){}},
  navigator:{},location:{pathname:'/',origin:'https://vital.test'},console,
  setTimeout(){},clearTimeout(){},crypto:require('node:crypto').webcrypto,
  URL,Blob,FormData,File,fetch(){throw new Error('No network allowed in tests');}
};
sandbox.window.window=sandbox.window;
const exposing=source.replace('  init();\n})();',"  globalThis.__vaultTest={state,renderVault,renderCard,resetVault,VAULT_CATEGORIES,VAULT_MIMES,vaultDocument};\n  init();\n})();");
assert.notEqual(exposing,source,'Expected to inject test hooks');
vm.runInNewContext(exposing,sandbox,{timeout:1500});
const ctx=sandbox.__vaultTest;
assert(ctx,'Test hooks initialized');
assert(root.innerHTML.includes('تسجيل الدخول'));
ctx.state.user={id:'11111111-1111-4111-8111-111111111111'};
ctx.state.vaultLoaded=true;
let html=ctx.renderVault();
assert(html.includes('خزنة المستندات الطبية'));
assert(html.includes('No')===false);
assert(html.includes('مافيش مستندات مرفوعة'));
assert(html.includes('type="file"'));
assert(html.includes('type="date"'));
assert.equal(ctx.VAULT_CATEGORIES.length,5);
ctx.state.documents=[{id:'abc',title:'<img src=x onerror=alert(1)>',category:'lab',file_size:1000,document_date:'2026-11-01',mime_type:'image/png',storage_path:ctx.state.user.id+'/abc.png'}];
html=ctx.renderVault();
assert(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
assert(!html.includes('<img src=x onerror=alert(1)>'));
assert(ctx.vaultDocument('abc').title.startsWith('<img'));
ctx.state.vaultFilter='other';
assert(!ctx.renderVault().includes('&lt;img src='));
ctx.resetVault();
assert.equal(ctx.state.documents.length,0);
assert.equal(ctx.state.vaultLoaded,false);
console.log('PASS: vault navigation, rendering, blank state, XSS escaping, filtering, reset, storage path isolation scaffolding');
