import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const [configFile, observedFile] = process.argv.slice(2);
if (!configFile || !observedFile) throw new Error('Usage: node scripts/check-linear.mjs CONFIG.json OBSERVED.json');
const config = JSON.parse(await readFile(configFile, 'utf8'));
const observed = JSON.parse(await readFile(observedFile, 'utf8'));
assert.equal(config.development.repository, 'Shuang-su/focus-on');
assert.equal(config.inbox.repository, 'Shuang-su/focus-on-vault');
assert.equal(config.development.key, 'DEV');
assert.equal(config.inbox.key, 'LIFE');
for (const expected of [config.development, config.inbox]) {
  const team = observed.teams.find(item => item.id === expected.id);
  assert(team, `Missing team ${expected.key}`);
  assert.equal(team.key, expected.key);
}
for (const state of config.inbox.states) {
  assert(observed.inboxStates.some(item => item.name === state.name && item.type === state.type), `Missing state ${state.name}/${state.type}`);
}
assert(observed.projects.some(item => item.id === config.project.id && item.name === config.project.name), 'Missing foundation project');
console.log(JSON.stringify({ configurationVerified: true, developmentKey: 'DEV', inboxKey: 'LIFE', states: config.inbox.states.length, liveSyncVerified: observed.liveSyncVerified === true }, null, 2));
