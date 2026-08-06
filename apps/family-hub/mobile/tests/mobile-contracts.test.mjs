import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFamilyLabUrl } from '../src/runtime/deep-links.mjs';
import { capabilityRegistry } from '../src/runtime/capability-registry.mjs';

test('accepts semantic Family Lab deep links', () => {
  assert.equal(parseFamilyLabUrl('familylab://task/t_123').accepted, true);
});

test('rejects unknown routes', () => {
  assert.equal(parseFamilyLabUrl('familylab://admin/export-secrets').accepted, false);
});

test('all scaffolded capabilities declare a fallback', () => {
  for (const entry of Object.values(capabilityRegistry)) assert.ok(entry.fallback);
});
