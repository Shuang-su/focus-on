import { canonical, digest, readVault, validateRequest, validateChangeSet } from './vault.js';
import type { CaptureRequest, ChangeSet, ProcessingReceipt, RecordData } from './contracts.js';

const directories: Record<RecordData['kind'], string> = {
  collection: 'collections', note: 'notes', task: 'life/tasks', plan: 'life/plans', wishlist: 'life/wishlist',
  finance_draft: 'finance/pending', budget: 'finance/budgets', subscription: 'finance/subscriptions', entity: 'entities', attachment: 'attachments-manifest',
};
export async function planChanges(request: CaptureRequest, vaultPath: string, previous?: ChangeSet): Promise<{ changeSet: ChangeSet; receipt: ProcessingReceipt }> {
  if (!validateRequest(request)) throw new Error('Invalid CaptureRequest: ' + JSON.stringify(validateRequest.errors));
  const vault = await readVault(vaultPath);
  if (vault.errors.length) throw new Error('Invalid vault: ' + vault.errors.join('; '));
  if (request.baseSnapshot !== vault.snapshot) throw new Error('Conflict: vault snapshot changed');
  const seen = new Set<string>();
  const inputHash = digest(canonical(request));
  if (previous) {
    if (!validateChangeSet(previous)) throw new Error('Invalid previous ChangeSet');
    if (previous.requestId !== request.requestId || previous.inputVersion !== request.inputVersion) throw new Error('Previous ChangeSet belongs to a different request version');
    if (previous.inputHash !== inputHash) throw new Error('Conflict: input changed without a new inputVersion');
    if (previous.baseSnapshot !== vault.snapshot) throw new Error('Conflict: previous plan base changed');
  }
  const changes: ChangeSet['changes'] = [];
  for (const operation of request.operations) {
    const record = operation.record;
    if (seen.has(record.id)) throw new Error('Duplicate operation for record ID');
    seen.add(record.id);
    const existing = vault.records.get(record.id);
    if (operation.op === 'create') {
      if (operation.expectedRevision !== undefined) throw new Error('Create cannot carry expectedRevision');
      if (existing || record.revision !== 1) throw new Error('Conflict: create requires a new ID and revision 1');
      const stableId = 'rec_' + digest(vault.manifest.vaultId + ':' + request.requestId + ':' + request.inputVersion + ':' + changes.length).slice(0, 24);
      if (record.id !== stableId) throw new Error('Create ID must be stable: ' + stableId);
    } else {
      if (!existing || operation.expectedRevision !== existing.record.revision || record.revision !== existing.record.revision + 1) throw new Error('Conflict: record revision changed');
      if (record.kind !== existing.record.kind || record.createdAt !== existing.record.createdAt) throw new Error('Update cannot change record kind or createdAt');
    }
    const beforeHash = existing ? digest(canonical(existing.record)) : null;
    changes.push({ op: operation.op, path: existing?.path ?? directories[record.kind] + '/' + record.id + '.json', beforeHash, afterHash: digest(canonical(record)), record });
  }
  const resulting = new Map([...vault.records.entries()].map(([id, entry]) => [id, entry.record]));
  for (const change of changes) resulting.set(change.record.id, change.record);
  for (const change of changes) {
    for (const id of change.record.links) if (!resulting.has(id)) throw new Error('Missing reference in proposed change: ' + id);
    if (change.record.kind === 'finance_draft') {
      for (const key of ['accountId', 'counterpartyAccountId', 'originalTransactionId'] as const) if (change.record[key] && !resulting.has(change.record[key]!)) throw new Error('Missing finance reference');
      for (const key of ['accountId', 'counterpartyAccountId'] as const) {
        const ref = change.record[key]; const account = ref ? resulting.get(ref) : undefined;
        if (ref && (account?.kind !== 'entity' || account.entityType !== 'account')) throw new Error('Finance account reference must point to an account entity');
      }
      if (change.record.originalTransactionId && resulting.get(change.record.originalTransactionId)?.kind !== 'finance_draft') throw new Error('Refund reference must point to a financial draft');
      if (change.record.transactionType === 'transfer' && (!change.record.accountId || !change.record.counterpartyAccountId || change.record.accountId === change.record.counterpartyAccountId)) throw new Error('Transfer needs two different accounts');
      if (change.record.transactionType === 'refund' && !change.record.originalTransactionId) throw new Error('Refund needs originalTransactionId');
    }
    if ('bodyPath' in change.record && change.record.bodyPath) throw new Error('Body changes require a future attachment writer; foundation planner only plans structured records');
    if (change.record.kind === 'collection' && change.record.archiveStatus === 'readable_copy') throw new Error('Readable copies require body evidence');
    if (change.record.kind === 'attachment' && change.record.archiveStatus !== 'reference_only') throw new Error('Saved attachments require the future writer and byte verification');
  }
  return {
    changeSet: { schemaVersion: 1, requestId: request.requestId, inputVersion: request.inputVersion, inputHash, baseSnapshot: vault.snapshot, branch: `capture/${request.requestId}/v${request.inputVersion}`, changes },
    receipt: { schemaVersion: 1, requestId: request.requestId, inputVersion: request.inputVersion, inputHash, status: 'planned', recordIds: changes.map(c => c.record.id), verification: { verified: false, snapshot: vault.snapshot } },
  };
}
