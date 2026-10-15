/**
 * Contract Fixtures Type Compatibility Test
 * Verifies that all 7 JSON fixtures in src/contracts/fixtures/ are 100% type-compatible
 * with their corresponding TypeScript interfaces in src/types/api.ts.
 */
import { describe, it, expect } from 'vitest';

import inventoryJson from './inventory.json';
import purchaseOrderJson from './purchase-order.json';
import authClaimsJson from './auth-claims.json';
import errorJson from './error.json';
import aiInsightJson from './ai-insight.json';
import aiAgentToolJson from './ai-agent-tool.json';
import eventSaleCreatedJson from './event-sale-created.json';

import type {
  InventoryItem,
  PurchaseOrder,
  AuthClaims,
  ApiError,
  Insight,
  AgentTool,
  EventEnvelope,
  SaleCreatedPayload,
} from '../../types/api';

describe('Contract Fixtures Type Compatibility', () => {
  it('inventory.json matches InventoryItem', () => {
    const item: InventoryItem = inventoryJson;
    expect(item.product_id).toBe('b3f1c2a0-4e51-4a2e-9d3e-000000000001');
    expect(item.schema).toBe('canonical.InventoryItem');
  });

  it('purchase-order.json matches PurchaseOrder', () => {
    const po: PurchaseOrder = purchaseOrderJson;
    expect(po.supplier_id).toBe('8a1e9c20-1b2c-4d3e-8f9a-000000000001');
    expect(po.schema).toBe('canonical.PurchaseOrder');
    expect(po.lines?.[0].quantity).toBe(300);
  });

  it('auth-claims.json matches AuthClaims', () => {
    const claims: AuthClaims = authClaimsJson;
    expect(claims.sub).toBe('user-uuid');
    expect(claims.roles).toContain('Pharmacist');
  });

  it('error.json matches ApiError', () => {
    const err: ApiError = errorJson;
    expect(err.error.code).toBe('VALIDATION_ERROR');
    expect(err.error.details?.[0].field).toBe('quantity');
  });

  it('ai-insight.json matches Insight', () => {
    const insight: Insight = aiInsightJson;
    expect(insight.type).toBe('insight.stockout_risk');
    expect(insight.forecast?.horizon_days).toBe(14);
  });

  it('ai-agent-tool.json matches AgentTool', () => {
    const tool: AgentTool = aiAgentToolJson;
    expect(tool.name).toBe('create_purchase_order');
    expect(tool.requires_approval).toBe(true);
  });

  it('event-sale-created.json matches EventEnvelope<SaleCreatedPayload>', () => {
    const event: EventEnvelope<SaleCreatedPayload> = eventSaleCreatedJson;
    expect(event.event_type).toBe('SaleCreated');
    expect(event.payload.total_amount).toBe(91.0);
  });
});
