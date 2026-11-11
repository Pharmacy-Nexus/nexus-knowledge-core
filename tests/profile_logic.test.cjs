// Fast structural checks; do not contact real Supabase or store real medical data.
const fs=require('fs');const assert=require('assert');
const app=fs.readFileSync(__dirname+'/../app.js','utf8');
const migration=fs.readFileSync(__dirname+'/../supabase/003_medical_profile_sections.sql','utf8');
assert(app.includes("{ key:'surgeries'"),'Surgeries field missing');
for(const key of ['allergies','conditions','medications','surgeries']) {
  assert(app.includes(`{ key:'${key}'`));
}
assert(app.includes('MED_GROUPS'));
assert(app.includes('data-med-entry'));
assert(app.includes("data-action=\\\"add-med-entry\\\"") || app.includes('data-action="add-med-entry"'));
assert(app.includes("if(action==='resume-publish')"),'Existing card-resume action must remain');
assert(app.includes("if(action==='unpublish')"),'Existing card-suspend action must remain');
assert(migration.includes("v_previous_fields->>v_key"),'Migration must preserve missing fields');
assert(migration.includes("'surgeries'"),'Migration must support surgeries');
assert(!/delete from public\.medical_profiles|truncate |drop table/i.test(migration),'Migration may not delete profiles');
console.log('PASS: Medical sections, backward compatibility, card actions and migration guards');
