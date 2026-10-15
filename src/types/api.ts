/**
 * ERP Brain — Canonical API & Data Contracts
 * Derived strictly from ERP-Brain-Architecture-Blueprint.md (Sections 16 & 17)
 * Phase 0: Architecture & Contracts
 */

// ============================================================================
// 1. Canonical Envelope & Base Audit Spine (Section 16 & Section 17)
// ============================================================================

export interface CanonicalEnvelope {
  schema?: string;
  version?: string;
}

export interface CreatedByAgent {
  type: 'agent' | 'human' | string;
  session_id?: string;
  approved_by?: string;
}

export type AgentCreatedBy = CreatedByAgent;

/**
 * Base audit fields across DB tables and API wire payloads.
 * Fields omitted on wire payloads (e.g. POST requests or partial GET projections)
 * are optional to ensure 100% compatibility with API fixtures and database models.
 */
export interface AuditSpine extends CanonicalEnvelope {
  id?: string;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string | CreatedByAgent;
  updated_by?: string;
}

/** Strict DB-persisted audit spine where all audit columns are guaranteed present */
export interface StrictAuditSpine extends AuditSpine {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

// ============================================================================
// 2. ERP Entities (Section 17.1 & Section 8.1)
// ============================================================================

export interface Product extends AuditSpine {
  sku: string;
  name: string;
  category: string;
  unit: string;
  is_active?: boolean;
  deleted_at?: string | null;
}

export interface InventoryItem extends AuditSpine {
  product_id: string;
  sku?: string;
  quantity_on_hand: number;
  reserved_quantity: number;
  available_quantity?: number;
  unit?: string;
  location_id: string;
  reorder_point: number;
}

export interface StockMovement extends AuditSpine {
  product_id: string;
  delta: number;
  reason: string;
  reference_id: string;
}

export interface SaleLine {
  id?: string;
  sale_id?: string;
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface Sale extends AuditSpine {
  customer_id?: string | null;
  employee_id?: string;
  status?: string;
  total?: number;
  total_amount?: number;
  occurred_at?: string;
  lines?: SaleLine[];
}

export interface PurchaseOrderLine {
  id?: string;
  purchase_order_id?: string;
  product_id: string;
  quantity: number;
}

export type PurchaseOrderStatus = 'draft' | 'approved' | 'sent' | 'received';

export interface PurchaseOrder extends AuditSpine {
  supplier_id: string;
  status?: PurchaseOrderStatus;
  created_by_type?: 'human' | 'agent';
  approved_by?: string | null;
  lines?: PurchaseOrderLine[];
  created_by?: string | CreatedByAgent;
}

export interface Supplier extends AuditSpine {
  name: string;
  contact: string;
  lead_time_days: number;
  deleted_at?: string | null;
}

export interface Customer extends AuditSpine {
  name: string;
  contact: string;
  deleted_at?: string | null;
}

export interface Employee extends AuditSpine {
  name: string;
  role: string;
}

// ============================================================================
// 3. Authentication Contract (Section 16.8 & Section 12)
// ============================================================================

export type UserRole = 'Admin' | 'Pharmacist' | 'Staff';

export interface AuthClaims {
  sub: string;
  roles: UserRole[] | string[];
  tenant_id: string;
  scopes: string[];
  iat: number;
  exp: number;
}

export interface AuthResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  claims?: AuthClaims;
}

// ============================================================================
// 4. Standardized Error Contract (Section 16.9)
// ============================================================================

export interface ApiErrorDetail {
  field: string;
  issue: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
    trace_id?: string;
  };
}

// ============================================================================
// 5. AI Outputs & Intelligence (Section 16.3, Section 10, Section 11)
// ============================================================================

export interface Forecast {
  horizon_days: number;
  predicted_stockout_date?: string;
  expected_demand: number;
  current_available?: number;
  product_id?: string;
  model_version?: string;
  predicted_demand?: number;
  confidence_low?: number;
  confidence_high?: number;
  generated_at?: string;
}

export interface Recommendation {
  type: string;
  suggested_quantity?: number;
  supplier_id?: string;
  risk_id?: string;
  payload?: Record<string, unknown>;
}

export interface ActionProposal {
  id: string;
  tool_name: string;
  arguments: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  session_id?: string;
  requires_approval: boolean;
  created_at?: string;
}

export interface ActionResult {
  status: 'success' | 'failed';
  reason?: string;
  result?: Record<string, unknown>;
}

export interface Explanation {
  text: string;
  subtype?: 'report' | 'narrative' | string;
  factors?: string[];
}

export interface Alert {
  id?: string;
  severity: 'low' | 'medium' | 'high' | string;
  message: string;
  entity_type?: string;
  entity_id?: string;
  created_at?: string;
}

export interface Risk {
  id?: string;
  entity_type?: string;
  entity_id?: string;
  score?: number;
  severity: 'low' | 'medium' | 'high' | string;
  detected_at?: string;
}

export interface InsightEntity {
  type: string;
  id: string;
  name: string;
}

export interface InsightGeneratedBy {
  component: string;
  model_version: string;
}

export interface Insight {
  type: string;
  id: string;
  entity: InsightEntity;
  severity: 'low' | 'medium' | 'high' | string;
  confidence: number;
  forecast?: Forecast;
  explanation?: string | Explanation;
  recommendation?: Recommendation;
  generated_at: string;
  generated_by: InsightGeneratedBy;
}

// ============================================================================
// 6. Agent Tools Contract (Section 16.4)
// ============================================================================

export interface AgentToolInputSchema {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
}

export interface AgentTool {
  name: string;
  description: string;
  read_only: boolean;
  requires_approval: boolean;
  input_schema: AgentToolInputSchema;
}

// ============================================================================
// 7. Event Bus & Event Envelopes (Section 16.7)
// ============================================================================

export type CoreEventType =
  | 'SaleCreated'
  | 'InventoryUpdated'
  | 'PurchaseOrderCreated'
  | 'StockThresholdReached';

export interface EventEnvelope<T> {
  event_id: string;
  event_type: CoreEventType | string;
  occurred_at: string;
  tenant_id: string;
  source: string;
  version: string;
  payload: T;
}

export interface SaleCreatedLine {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface SaleCreatedPayload {
  sale_id: string;
  lines: SaleCreatedLine[];
  customer_id?: string | null;
  total_amount: number;
}
