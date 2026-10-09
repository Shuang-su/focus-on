import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, readFile, writeFile, symlink, mkdtemp, lstat } from 'node:fs/promises';
import path from 'node:path';
import { readVault, canonical, digest, validateChangeSet, validateReceipt } from '../src/vault.js';
import { outputDirectory, writeOutput } from '../src/output.js';
import { planChanges } from '../src/planner.js';
import type { CaptureRequest } from '../src/contracts.js';

const example = path.resolve('examples/vault');
async function sandbox(name: string) {
  const parent = path.resolve('.codex-work/tmp/tests');
  await mkdir(parent, { recursive: true });
  const root = await mkdtemp(path.join(parent, name + '-'));
  await cp(example, root, { recursive: true, force: true });
  return root;
}
async function request(vault: string): Promise<CaptureRequest> {
  const snapshot = await readVault(vault);
  const req = JSON.parse(await readFile('examples/requests/create-task.json', 'utf8')) as CaptureRequest;
  req.baseSnapshot = snapshot.snapshot;
  return req;
}
test('synthetic vault validates all supported modules and preserves business states', async () => {
  const v = await readVault(example); assert.deepEqual(v.errors, []); assert.equal(v.records.size, 12);
  assert.equal((v.records.get('task_sample')!.record as any).status, 'todo');
  assert.equal((v.records.get('finance_sample')!.record as any).status, 'pending');
  assert.equal(v.records.get('wishlist_sample')!.record.kind, 'wishlist');
});
test('fresh filesystem restore preserves record counts and complete content snapshot', async () => {
  const v = await readVault(await sandbox('restore')); const original = await readVault(example);
  assert.deepEqual(v.errors, []); assert.equal(v.records.size, original.records.size); assert.equal(v.snapshot, original.snapshot);
});
test('repeated capture produces identical IDs, branches, hashes and planned receipts without changing vault', async () => {
  const req = await request(example); const before = await readVault(example);
  const a = await planChanges(req, example); const b = await planChanges(req, example);
  assert.deepEqual(a, b); assert.equal(a.receipt.status, 'planned'); assert.equal(a.receipt.verification.verified, false);
  assert.equal((await readVault(example)).snapshot, before.snapshot);
});
test('stale base and reused record ID are conflicts', async () => {
  const req = await request(example); req.baseSnapshot = '0'.repeat(64);
  await assert.rejects(planChanges(req, example), /snapshot changed/);
  const next = await request(example); next.operations[0]!.record.id = 'task_sample';
  await assert.rejects(planChanges(next, example), /new ID/);
});
test('changed input version must produce a different stable record ID', async () => {
  const req = await request(example); req.inputVersion += 1;
  await assert.rejects(planChanges(req, example), /stable/);
});
test('revision updates require expected revision and retain domain and creation time', async () => {
  const req = await request(example); const v = await readVault(example);
  const original = structuredClone(v.records.get('task_sample')!.record);
  req.operations = [{ op: 'update', expectedRevision: 1, record: { ...original, revision: 2 } }];
  const plan = await planChanges(req, example); assert.equal(plan.changeSet.changes[0]!.op, 'update');
  req.operations[0]!.expectedRevision = 2; await assert.rejects(planChanges(req, example), /revision changed/);
});
test('dangling record references and duplicate IDs are rejected', async () => {
  const root = await sandbox('references');
  const file = path.join(root, 'life/tasks/task_sample.json'); const record = JSON.parse(await readFile(file, 'utf8'));
  record.links = ['missing_record']; await writeFile(file, JSON.stringify(record));
  await writeFile(path.join(root, 'life/tasks/duplicate.json'), JSON.stringify(record));
  const v = await readVault(root); assert(v.errors.some(x => x.includes('Duplicate'))); assert(v.errors.some(x => x.includes('missing reference')));
});
test('money uses safe integer minor units and drafts cannot claim confirmed status', async () => {
  for (const [label, value] of [['fraction', 1.2], ['unsafe', Number.MAX_SAFE_INTEGER + 1], ['negative', -1]] as const) {
    const root = await sandbox('money-' + label); const file = path.join(root, 'finance/pending/finance_sample.json');
    const record = JSON.parse(await readFile(file, 'utf8')); record.money.amountMinor = value; await writeFile(file, JSON.stringify(record));
    assert((await readVault(root)).errors.length > 0);
  }
  const root = await sandbox('confirmed'); const file = path.join(root, 'finance/pending/finance_sample.json');
  const record = JSON.parse(await readFile(file, 'utf8')); record.status = 'confirmed'; await writeFile(file, JSON.stringify(record));
  assert((await readVault(root)).errors.length > 0);
});
test('tampered saved attachment fails byte verification', async () => {
  const root = await sandbox('attachment'); await writeFile(path.join(root, 'attachments/sample.txt'), 'altered');
  assert((await readVault(root)).errors.some(x => x.includes('hash/size mismatch')));
});
test('external URLs never qualify as saved attachments', async () => {
  const root = await sandbox('remote'); const file = path.join(root, 'attachments-manifest/attachment_sample.json');
  const record = JSON.parse(await readFile(file, 'utf8')); record.storage = 'remote_reference'; await writeFile(file, JSON.stringify(record));
  assert((await readVault(root)).errors.length > 0);
});
test('path traversal and symlinks cannot read outside vault', async () => {
  const root = await sandbox('traversal'); const file = path.join(root, 'collections/collection_sample.json');
  const record = JSON.parse(await readFile(file, 'utf8')); record.bodyPath = '../package.json'; await writeFile(file, JSON.stringify(record));
  assert((await readVault(root)).errors.some(x => x.includes('unsafe bodyPath')));
  const links = await sandbox('symlink'); await symlink(path.resolve('package.json'), path.join(links, 'life/tasks/outside.json'));
  await assert.rejects(readVault(links), /Symlink/);
});
test('unknown format versions and malformed JSON fail validation', async () => {
  const root = await sandbox('version'); const file = path.join(root, 'manifest.json');
  const manifest = JSON.parse(await readFile(file, 'utf8')); manifest.schemaVersion = 2; await writeFile(file, JSON.stringify(manifest));
  await writeFile(path.join(root, 'life/tasks/broken.json'), '{');
  const v = await readVault(root); assert(v.errors.some(x => x.includes('manifest'))); assert(v.errors.some(x => x.includes('invalid JSON')));
});
test('malicious extra commands cannot enter a change set and references are verified before planning', async () => {
  const req = await request(example); (req as any).command = 'cat ~/.ssh/id_rsa';
  await assert.rejects(planChanges(req, example), /Invalid CaptureRequest/);
  delete (req as any).command; req.operations[0]!.record.links = ['missing_record'];
  await assert.rejects(planChanges(req, example), /Missing reference/);
});
test('canonical hashes ignore JSON property order', () => { assert.equal(digest(canonical({ b: 2, a: 1 })), digest(canonical({ a: 1, b: 2 }))); });
test('handoff detects changed input within the same request version', async () => {
  const req = await request(example); const original = await planChanges(req, example);
  assert(validateChangeSet(original.changeSet)); assert(validateReceipt(original.receipt));
  req.input.text = 'changed input';
  await assert.rejects(planChanges(req, example, original.changeSet), /input changed/);
  const invalid = { ...original.receipt, status: 'stored' };
  assert.equal(validateReceipt(invalid), false);
});
test('finance account and refund references retain their domain types', async () => {
  const root = await sandbox('finance-types'); const file = path.join(root, 'finance/pending/finance_sample.json');
  const record = JSON.parse(await readFile(file, 'utf8')); record.accountId = 'task_sample';
  await writeFile(file, JSON.stringify(record));
  assert((await readVault(root)).errors.some(x => x.includes('account entity')));
  record.accountId = 'account_sample'; record.transactionType = 'refund'; record.originalTransactionId = 'task_sample';
  await writeFile(file, JSON.stringify(record));
  assert((await readVault(root)).errors.some(x => x.includes('financial draft')));
});
test('output paths cannot create outside directories or overwrite through symlinks', async () => {
  const project = await sandbox('output'); const outside = path.join(project, 'outside');
  await assert.rejects(outputDirectory(project, outside), /inside/);
  await assert.rejects(lstat(outside), { code: 'ENOENT' });
  const directory = await outputDirectory(project, path.join(project, '.codex-work/tmp/result'));
  const original = path.join(project, 'manifest.json'); const before = await readFile(original, 'utf8');
  await symlink(original, path.join(directory, 'receipt.json'));
  await assert.rejects(writeOutput(directory, 'receipt.json', 'overwrite'));
  assert.equal(await readFile(original, 'utf8'), before);
});
