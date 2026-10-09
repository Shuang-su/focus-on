import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const [configFile, observedFile] = process.argv.slice(2);
if (!configFile || !observedFile) throw new Error('Usage: node scripts/check-linear.mjs CONFIG.json OBSERVED.json');
const config = JSON.parse(await readFile(configFile, 'utf8'));
const observed = JSON.parse(await readFile(observedFile, 'utf8'));
assert.equal(config.development.repository, 'Shuang-su/Metaflow');
assert.equal(config.inbox.repository, 'Shuang-su/focus-on-vault');
assert.equal(config.development.key, 'DEV');
assert.equal(config.inbox.key, 'FOCUS');
assert.equal(config.inbox.name, 'Focus On');
assert.equal(config.focusOnDevelopment.repository, 'Shuang-su/focus-on');
assert.equal(config.focusOnDevelopment.teamKey, 'DEV');
assert.equal(config.focusOnDevelopment.issueCreationPolicy, 'github-first');
assert.equal(config.focusOnDevelopment.issueSyncOptional, 'github-to-linear-one-way');
for (const expected of [config.development, config.inbox]) {
  const team = observed.teams.find(item => item.id === expected.id);
  assert(team, `Missing team ${expected.key}`);
  assert.equal(team.key, expected.key);
  assert.equal(team.name, expected.name);
}
for (const state of config.inbox.states) {
  assert(observed.inboxStates.some(item => item.name === state.name && item.type === state.type), `Missing state ${state.name}/${state.type}`);
}
assert(observed.projects.some(item => item.id === config.project.id && item.name === config.project.name), 'Missing foundation project');
for (const [key, value] of Object.entries(config.inbox.workflow ?? {})) {
  assert.equal(observed.inboxWorkflow?.[key], value, `Workflow mismatch: ${key}`);
}
console.log(JSON.stringify({ configurationVerified: true, developmentKey: 'DEV', developmentSyncTarget: config.development.repository, inboxKey: 'FOCUS', inboxSyncTarget: config.inbox.repository, states: config.inbox.states.length, liveSyncVerified: observed.liveSyncVerified === true }, null, 2));
