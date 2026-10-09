import type { FromSchema } from 'json-schema-to-ts';

export const moneySchema = {
  type: 'object', additionalProperties: false,
  required: ['amountMinor', 'currency', 'precision'],
  properties: {
    amountMinor: { type: 'integer', minimum: 0, maximum: Number.MAX_SAFE_INTEGER },
    currency: { type: 'string', pattern: '^[A-Z]{3}$' },
    precision: { type: 'integer', minimum: 0, maximum: 4 },
  },
} as const;
const recordId = { type: 'string', pattern: '^[a-z][a-z0-9_-]{2,100}$' } as const;
const common = {
  schemaVersion: { const: 1 }, id: recordId,
  revision: { type: 'integer', minimum: 1 },
  title: { type: 'string', minLength: 1, maxLength: 500 },
  createdAt: { type: 'string', format: 'date-time' },
  updatedAt: { type: 'string', format: 'date-time' },
  source: {
    type: 'object', additionalProperties: false, required: ['kind', 'reference'],
    properties: { kind: { enum: ['synthetic', 'manual', 'github', 'linear', 'chatgpt', 'dot'] }, reference: { type: 'string', minLength: 1 } },
  },
  links: { type: 'array', items: recordId, uniqueItems: true },
} as const;
const commonRequired = ['schemaVersion', 'id', 'revision', 'title', 'createdAt', 'updatedAt', 'source', 'links'] as const;
export const recordSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://focus-on.example/schemas/record-v1',
  oneOf: [
    { type: 'object', additionalProperties: false, required: [...commonRequired, 'kind', 'archiveStatus'], properties: { ...common, kind: { const: 'collection' }, archiveStatus: { enum: ['link_only', 'partial', 'readable_copy', 'needs_input'] }, url: { type: 'string', format: 'uri' }, bodyPath: { type: 'string' }, tags: { type: 'array', items: { type: 'string' }, uniqueItems: true } } },
    { type: 'object', additionalProperties: false, required: [...commonRequired, 'kind', 'bodyPath'], properties: { ...common, kind: { const: 'note' }, bodyPath: { type: 'string' } } },
    { type: 'object', additionalProperties: false, required: [...commonRequired, 'kind', 'status'], properties: { ...common, kind: { const: 'task' }, status: { enum: ['todo', 'in_progress', 'done', 'canceled'] } } },
    { type: 'object', additionalProperties: false, required: [...commonRequired, 'kind', 'status'], properties: { ...common, kind: { const: 'plan' }, status: { enum: ['proposed', 'scheduled', 'done', 'canceled'] } } },
    { type: 'object', additionalProperties: false, required: [...commonRequired, 'kind', 'status', 'budget'], properties: { ...common, kind: { const: 'wishlist' }, status: { enum: ['considering', 'purchased', 'dismissed'] }, budget: moneySchema } },
    { type: 'object', additionalProperties: false, required: [...commonRequired, 'kind', 'status', 'transactionType', 'money'], properties: { ...common, kind: { const: 'finance_draft' }, status: { const: 'pending' }, transactionType: { enum: ['expense', 'income', 'transfer', 'refund'] }, money: moneySchema, accountId: recordId, counterpartyAccountId: recordId, originalTransactionId: recordId } },
    { type: 'object', additionalProperties: false, required: [...commonRequired, 'kind', 'entityType'], properties: { ...common, kind: { const: 'entity' }, entityType: { enum: ['place', 'product', 'possession', 'account'] }, locationStatus: { enum: ['unconfirmed', 'confirmed'] }, coordinates: { type: 'object', additionalProperties: false, required: ['latitude', 'longitude', 'system', 'evidence'], properties: { latitude: { type: 'number', minimum: -90, maximum: 90 }, longitude: { type: 'number', minimum: -180, maximum: 180 }, system: { enum: ['WGS84', 'GCJ02'] }, evidence: { type: 'string', minLength: 1 } } } } },
    { type: 'object', additionalProperties: false, required: [...commonRequired, 'kind', 'money'], properties: { ...common, kind: { enum: ['budget', 'subscription'] }, money: moneySchema } },
    { type: 'object', additionalProperties: false, required: [...commonRequired, 'kind', 'storage', 'archiveStatus'], properties: { ...common, kind: { const: 'attachment' }, storage: { enum: ['local', 'remote_reference'] }, archiveStatus: { enum: ['saved', 'missing', 'reference_only'] }, path: { type: 'string' }, sha256: { type: 'string', pattern: '^[a-f0-9]{64}$' }, size: { type: 'integer', minimum: 0 }, url: { type: 'string', format: 'uri' } } },
  ],
} as const;
export const manifestSchema = {
  type: 'object', additionalProperties: false,
  required: ['schemaVersion', 'vaultId', 'validator', 'synthetic'],
  properties: {
    schemaVersion: { const: 1 }, vaultId: recordId, synthetic: { type: 'boolean' },
    validator: { type: 'object', additionalProperties: false, required: ['repository', 'commit'], properties: { repository: { const: 'Shuang-su/focus-on' }, commit: { type: 'string', pattern: '^[a-f0-9]{40}$' } } },
  },
} as const;
export const captureRequestSchema = {
  type: 'object', additionalProperties: false,
  required: ['schemaVersion', 'requestId', 'inputVersion', 'source', 'input', 'capturedAt', 'baseSnapshot', 'operations'],
  properties: {
    schemaVersion: { const: 1 }, requestId: recordId, inputVersion: { type: 'integer', minimum: 1 },
    source: common.source, capturedAt: { type: 'string', format: 'date-time' },
    input: { type: 'object', additionalProperties: false, required: ['text'], properties: { text: { type: 'string', minLength: 1, maxLength: 100000 } } },
    baseSnapshot: { type: 'string', pattern: '^[a-f0-9]{64}$' },
    operations: { type: 'array', minItems: 1, maxItems: 100, items: {
      type: 'object', additionalProperties: false, required: ['op', 'record'],
      properties: { op: { enum: ['create', 'update'] }, expectedRevision: { type: 'integer', minimum: 1 }, record: recordSchema },
    } },
  },
} as const;

export type RecordData = FromSchema<typeof recordSchema>;
export type VaultManifest = FromSchema<typeof manifestSchema>;
export type CaptureRequest = FromSchema<typeof captureRequestSchema>;
const hash = { type: 'string', pattern: '^[a-f0-9]{64}$' } as const;
const processingIdentity = { schemaVersion: { const: 1 }, requestId: recordId, inputVersion: { type: 'integer', minimum: 1 }, inputHash: hash } as const;
export const changeSetSchema = {
  type: 'object', additionalProperties: false, required: ['schemaVersion', 'requestId', 'inputVersion', 'inputHash', 'baseSnapshot', 'branch', 'changes'],
  properties: { ...processingIdentity, baseSnapshot: hash, branch: { type: 'string', pattern: '^capture/[a-z][a-z0-9_-]{2,100}/v[1-9][0-9]*$' }, changes: {
    type: 'array', minItems: 1, items: { type: 'object', additionalProperties: false, required: ['op', 'path', 'beforeHash', 'afterHash', 'record'],
      properties: { op: { enum: ['create', 'update'] }, path: { type: 'string', minLength: 1 }, beforeHash: { anyOf: [hash, { type: 'null' }] }, afterHash: hash, record: recordSchema } },
  } },
} as const;
export const processingReceiptSchema = {
  type: 'object', additionalProperties: false, required: ['schemaVersion', 'requestId', 'inputVersion', 'inputHash', 'status', 'recordIds', 'verification'],
  properties: { ...processingIdentity, status: { enum: ['planned', 'awaiting_merge', 'stored', 'needs_input', 'failed'] }, recordIds: { type: 'array', uniqueItems: true, items: recordId },
    verification: { type: 'object', additionalProperties: false, required: ['verified', 'snapshot'], properties: { verified: { type: 'boolean' }, snapshot: hash } },
    evidence: { type: 'object', additionalProperties: false, properties: { issueUrl: { type: 'string', format: 'uri' }, prUrl: { type: 'string', format: 'uri' }, commit: { type: 'string', pattern: '^[a-f0-9]{40}$' } } },
  },
  if: { properties: { status: { const: 'stored' } } },
  then: { required: ['evidence'], properties: { verification: { properties: { verified: { const: true } } }, evidence: { required: ['commit'] } } },
} as const;
export type ChangeSet = FromSchema<typeof changeSetSchema>;
export type ProcessingReceipt = FromSchema<typeof processingReceiptSchema>;
