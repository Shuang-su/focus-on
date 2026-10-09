import { readFile, statfs } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readVault } from './vault.js';
import { planChanges } from './planner.js';
import { captureRequestSchema, manifestSchema, recordSchema, changeSetSchema, processingReceiptSchema } from './contracts.js';
import { outputDirectory, writeOutput } from './output.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const [command, ...args] = process.argv.slice(2);
const arg = (flag: string) => { const index = args.indexOf(flag); return index < 0 ? undefined : args[index + 1]; };
const json = (value: unknown) => console.log(JSON.stringify(value, null, 2));
try {
  if (command === 'doctor') {
    let git = 'unavailable'; try { git = execFileSync('git', ['status', '--short', '--branch'], { cwd: root, encoding: 'utf8' }).trim(); } catch {}
    const space = await statfs(root);
    json({ node: process.version, supportedNode: Number(process.versions.node.split('.')[0]) === 24, platform: process.platform, architecture: process.arch, root, git, vaultConfigured: !!process.env.FOCUS_VAULT_PATH, availableBytes: space.bavail * space.bsize, cache: path.join(root, '.codex-work/cache') });
    if (Number(process.versions.node.split('.')[0]) !== 24) process.exitCode = 1;
  } else if (command === 'validate') {
    const vault = arg('--vault') ?? process.env.FOCUS_VAULT_PATH; if (!vault) throw new Error('--vault is required');
    const result = await readVault(vault);
    json({ valid: !result.errors.length, records: result.records.size, snapshot: result.snapshot, errors: result.errors });
    if (result.errors.length) process.exitCode = 1;
  } else if (command === 'plan') {
    const vault = arg('--vault') ?? process.env.FOCUS_VAULT_PATH;
    const input = arg('--request'); if (!vault || !input) throw new Error('--vault and --request are required');
    const output = arg('--out');
    const destination = output ? await outputDirectory(root, output) : undefined;
    const previousFile = arg('--previous') ?? (destination ? path.join(destination, 'change-set.json') : undefined);
    let previous;
    if (previousFile) {
      try { previous = JSON.parse(await readFile(previousFile, 'utf8')); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT' || arg('--previous')) throw error; }
    }
    const result = await planChanges(JSON.parse(await readFile(input, 'utf8')), vault, previous);
    if (output) {
      await writeOutput(destination!, 'change-set.json', JSON.stringify(result.changeSet, null, 2) + '\n');
      await writeOutput(destination!, 'receipt.json', JSON.stringify(result.receipt, null, 2) + '\n');
      for (const [i, change] of result.changeSet.changes.entries()) await writeOutput(destination!, `change-${i}.diff`, `${change.op} ${change.path}\nbase ${change.beforeHash ?? 'new'}\n+${JSON.stringify(change.record)}\n`);
    }
    json(result);
  } else if (command === 'schemas') json({ manifest: manifestSchema, record: recordSchema, captureRequest: captureRequestSchema, changeSet: changeSetSchema, processingReceipt: processingReceiptSchema });
  else throw new Error('Usage: focus doctor | validate --vault PATH | plan --request FILE --vault PATH [--out .codex-work/tmp/NAME] | schemas');
} catch (e) { json({ error: e instanceof Error ? e.message : 'Unknown error' }); process.exitCode = 1; }
