import { existsSync, readFileSync } from 'node:fs';

const requiredFiles = [
  'client.fulfillment.schema.json',
  'tracking.manifest.json',
  'verification.checklist.md',
  'docs/manus-fulfillment-skills.md',
  'scripts/launch-check.mjs',
  'scripts/scan-placeholders.mjs',
  'scripts/admin-inventory-smoke.mjs',
  'scripts/verify-ghl-fields.mjs'
];

const missing = requiredFiles.filter((file) => !existsSync(file));
if (missing.length) {
  console.error('Missing fulfillment artifacts:\n' + missing.map((file) => '- ' + file).join('\n'));
  process.exit(1);
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    console.error(file + ' is not valid JSON: ' + error.message);
    process.exit(1);
  }
}

const schema = readJson('client.fulfillment.schema.json');
const tracking = readJson('tracking.manifest.json');
const checklist = readFileSync('verification.checklist.md', 'utf8');
const skills = readFileSync('docs/manus-fulfillment-skills.md', 'utf8');

const requiredSchemaSections = [
  'client',
  'brand',
  'domain',
  'offers',
  'cloudflare',
  'tracking',
  'crm',
  'leadVault',
  'inventory',
  'security',
  'handoff'
];

const missingSchemaSections = requiredSchemaSections.filter((section) => {
  return !schema.properties || !schema.properties[section];
});

if (missingSchemaSections.length) {
  console.error('client.fulfillment.schema.json missing sections:\n' + missingSchemaSections.map((section) => '- ' + section).join('\n'));
  process.exit(1);
}

const requiredEvents = [
  'PageView',
  'page_view',
  'ViewContent',
  'Lead',
  'generate_lead',
  'click_call',
  'pricing_click'
];

const eventNames = new Set([
  ...(tracking.browserEvents || []).map((event) => event.name),
  ...(tracking.serverEvents || []).map((event) => event.name)
]);

const missingEvents = requiredEvents.filter((event) => !eventNames.has(event));
if (missingEvents.length) {
  console.error('tracking.manifest.json missing required events:\n' + missingEvents.map((event) => '- ' + event).join('\n'));
  process.exit(1);
}

const requiredChecklistPhrases = [
  'Google Sheets Lead Vault',
  'GHL contact',
  'Meta CAPI',
  'GA4',
  'Microsoft Clarity',
  'D1',
  'R2',
  'launch:check',
  'admin:smoke',
  'placeholder:check',
  'Zero-Defect Exit Rule'
];

const missingChecklistPhrases = requiredChecklistPhrases.filter((phrase) => !checklist.includes(phrase));
if (missingChecklistPhrases.length) {
  console.error('verification.checklist.md missing proof sections:\n' + missingChecklistPhrases.map((phrase) => '- ' + phrase).join('\n'));
  process.exit(1);
}

const requiredSkillPhrases = [
  'Website Fulfillment Orchestrator',
  'Client Intake',
  'Repository And Cloudflare Provisioning',
  'Tracking Setup',
  'GHL And Lead Routing',
  'Inventory And Admin',
  'Verification And Launch Gate',
  'Client Handoff'
];

const missingSkillPhrases = requiredSkillPhrases.filter((phrase) => !skills.includes(phrase));
if (missingSkillPhrases.length) {
  console.error('docs/manus-fulfillment-skills.md missing skill sections:\n' + missingSkillPhrases.map((phrase) => '- ' + phrase).join('\n'));
  process.exit(1);
}

console.log('Fulfillment artifacts check passed.');
