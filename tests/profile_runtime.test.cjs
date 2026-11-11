const fs=require('fs'), vm=require('vm'), assert=require('assert');
const src=fs.readFileSync(__dirname+'/../app.js','utf8').replace(/\binit\(\);\s*\}\)\(\);\s*$/,'window.__VITAL_TEST={renderProfile,renderSharing,blankProfile,getFieldsFromForm,state,renderCard,medicalEntryMarkup};\n})();');
const root={addEventListener(){},querySelector(){return {value:''}},querySelectorAll(){return []}};
const ctx={
  window:{},document:{getElementById:n=>root},
  localStorage:{getItem:()=>null},navigator:{},console,
  location:{origin:'https://vital.example',pathname:'/'},
  crypto:{getRandomValues(bytes){bytes.fill(1)}},
  setTimeout:()=>0,clearTimeout:()=>{},scrollTo:()=>{}
};
vm.runInNewContext(src,ctx,{timeout:2000});
const a=ctx.window.__VITAL_TEST;
assert(a,'Test functions exported');
const blank=a.renderProfile();
assert.strictEqual((blank.match(/class="surface medical-section"/g)||[]).length,6);
for(const key of ['allergies','medications','conditions','surgeries']){
 assert(blank.includes(`data-med-list="${key}"`),key);
 assert(blank.includes(`data-med-key="${key}"`),key);
}
assert(blank.includes('حفظ التغييرات'));
assert(!blank.includes('Check item'),'No seeded data');
const sharing=a.renderSharing();
assert(sharing.includes('share-surgeries'),'Privacy toggle missing');
assert(sharing.includes('disabled'),'Missing value must disable sharing');
a.state.profile.fields.allergies='First note\nSecond note';
const expanded=a.renderProfile();
assert(expanded.includes('First note')&&expanded.includes('Second note'),'Legacy text missing');
assert(expanded.includes('aria-label="الحساسية وتفاعلاتها 2"'),'Legacy line split missing');
// Input collected from the existing multiline string storage format.
root.querySelectorAll=sel=>sel.includes('allergies')?[{value:'First note'},{value:'Second note'}]:[];
const values=a.getFieldsFromForm();
assert.strictEqual(values.allergies,'First note\nSecond note');
// Critical: user input is HTML-escaped before inserting into any render string.
a.state.profile.fields.surgeries='<script>alert(1)</script>';
assert(!a.renderProfile().includes('<script>alert(1)</script>'));
console.log('PASS: six sections, privacy, legacy entries, saving format, and HTML escaping');
