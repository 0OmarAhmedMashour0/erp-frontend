/**
 * Pharmacy ERP — API Contract TypeScript entry point.
 *
 * One re-export per domain. The OpenAPI master lives at /contracts/openapi.erp.yaml;
 * JSON Schemas at /contracts/schemas/*.json. All three describe the SAME DTOs —
 * contract tests enforce they never drift.
 */
export * from './common';
export * from './auth';
export * from './identity';
export * from './catalog';
export * from './inventory';
export * from './sales';
export * from './purchasing';
