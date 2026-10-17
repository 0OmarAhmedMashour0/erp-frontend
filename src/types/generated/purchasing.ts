/**
 * Pharmacy ERP — Purchasing contract (Stage 3). Mirrors schemas/purchasing.json.
 *
 * RUNTIME SPLIT (FE must respect):
 *  - Cloud: suppliers CRUD, PO create/approve/order, supplier payments,
 *           vendor-return READS
 *  - BranchLocal: PO receive, PO cancel-remaining, vendor-RETURN create/
 *    cancel/post
 *  A route asked at a runtime that does not own it returns 404/405.
 *
 * FLOWS (server authority):
 *  - PO totals: server computes; additional header costs are allocated
 *    pro-rata to ordered line net at creation and released to accepted units
 *    on receipts. FE never computes totals.
 *  - One-step receiving: accepts/rejects per lot; rejected units never enter
 *    sellable stock; shelf-life policy enforced (EXPIRY_POLICY_VIOLATION 422);
 *    exceptions are role-guarded with a reason.
 *  - Supplier payment is an order-level cash settlement (NOT AP ledger) —
 *    cannot exceed outstanding, currency must match PO.
 *  - Vendor returns never infer supplier credit/refund.
 */
import type {
  Uuid,
  Timestamp,
  Money,
  Numeric4,
  Numeric6,
  TaxRate,
  BusinessDate,
  Role,
  BranchScope,
} from './common';
import type { AddressDto } from './common';
import type { InventoryTxnDto } from './inventory';

// ---------------------------------------------------------------------------
// Closed value sets
// ---------------------------------------------------------------------------

export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'APPROVED'
  | 'ORDERED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CLOSED'
  | 'CANCELLED';

export type PurchaseOrderPaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
export type SupplierPaymentMethod = 'CASH';
export type VendorReturnStatus = 'DRAFT' | 'POSTED' | 'CANCELLED';

// ---------------------------------------------------------------------------
// Supplier (Cloud)
// ---------------------------------------------------------------------------

export interface SupplierDto {
  supplier_id: Uuid;
  supplier_code: string;
  legal_name: string;
  tax_registration_number: string | null;
  contact_email: string | null;
  phone: string | null;
  address: AddressDto;
  default_lead_time_days: number;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CreateSupplierRequest {
  supplier_code: string;
  legal_name: string;
  tax_registration_number?: string | null;
  contact_email?: string | null;
  phone?: string | null;
  address: AddressDto;
  default_lead_time_days?: number;
  is_active?: boolean;
}

export interface SupplierPatchRequest {
  legal_name?: string;
  tax_registration_number?: string | null;
  contact_email?: string | null;
  phone?: string | null;
  address?: AddressDto;
  default_lead_time_days?: number;
}

export interface SupplierStatusPatchRequest {
  is_active: boolean;
}

// ---------------------------------------------------------------------------
// Purchase order
// ---------------------------------------------------------------------------

export interface PurchaseOrderLineDto {
  po_line_id: Uuid;
  product_id: Uuid;
  product_uom_id: Uuid;
  entered_ordered_qty: Numeric4;
  conversion_snapshot: Numeric6;
  ordered_qty_base: Numeric4;
  received_qty_base: Numeric4; // cumulative ACCEPTED only
  rejected_qty_base: Numeric4; // replaceable; obligation stays open
  cancelled_qty_base: Numeric4;
  remaining_qty_base: Numeric4; // ordered - accepted - cancelled
  unit_cost_entered: Numeric4;
  unit_cost_base: Numeric4;
  discount_amount: Money;
  tax_rate_snapshot: TaxRate;
  tax_amount: Money;
  line_total: Money; // net, tax-exclusive
  allocated_additional_cost: Money;
  min_remaining_shelf_days: number; // default 90; 0 for non-lot products
}

export interface PurchaseOrderDto {
  purchase_order_id: Uuid;
  po_no: string;
  supplier_id: Uuid;
  branch_id: Uuid;
  created_by_employee_id: Uuid;
  status: PurchaseOrderStatus;
  expected_on: BusinessDate | null;
  currency_code: string; // must equal organization base_currency
  subtotal: Money;
  tax_total: Money;
  additional_costs: Money;
  total_amount: Money; // = subtotal + tax_total + additional_costs
  paid_amount: Money;
  outstanding_amount: Money; // = total - paid
  payment_status: PurchaseOrderPaymentStatus;
  ordered_at: Timestamp | null;
  lines: PurchaseOrderLineDto[];
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface PurchaseOrderLineRequest {
  product_id: Uuid;
  product_uom_id: Uuid;
  entered_ordered_qty: Numeric4;
  unit_cost_entered: Numeric4;
  discount_amount?: Money;
  /** informational; server snapshots PRODUCT.tax_rate */
  tax_rate_snapshot?: TaxRate | null;
  min_remaining_shelf_days?: number;
}

export interface CreatePurchaseOrderRequest {
  supplier_id: Uuid;
  branch_id: Uuid;
  expected_on?: BusinessDate | null;
  currency_code: string;
  additional_costs?: Money;
  lines: PurchaseOrderLineRequest[]; // min 1
}

export interface PurchaseOrderPatchRequest {
  expected_on?: BusinessDate | null;
  lines?: PurchaseOrderLineRequest[];
}

export interface CancelPurchaseOrderRequest {
  reason_code: string;
  note?: string | null;
}

export interface CancelPurchaseOrderRemainingRequest {
  reason_code: string;
  note?: string | null;
}

/** Empty request body for POST /api/v1/purchasing/orders/{id}/order */
export type OrderPurchaseOrderRequest = Record<string, never>;
// ---------------------------------------------------------------------------
// One-step receiving (BranchLocal)
// ---------------------------------------------------------------------------

export interface ReceiveLineRequest {
  po_line_id: Uuid;
  product_id: Uuid;
  product_uom_id: Uuid;
  /** = accepted + rejected */
  received_qty_base: Numeric4;
  accepted_qty_base: Numeric4;
  rejected_qty_base: Numeric4;
  /** Exact, case-sensitive; batch row created/deterministic UUIDv5 */
  batch_number: string;
  manufactured_on?: BusinessDate;
  /** required for lot-tracked products; must pass shelf-life policy */
  expires_on: BusinessDate | null;
  /** required for authorized shelf-life exception */
  override_reason?: string | null;
}

export interface ReceivePurchaseOrderRequest {
  location_id: Uuid;
  received_on: BusinessDate; // organization business date
  lines: ReceiveLineRequest[]; // min 1
}

export interface PurchaseReceiptResultLine {
  po_line_id: Uuid;
  product_id: Uuid;
  accepted_qty_base: Numeric4;
  rejected_qty_base: Numeric4;
  remaining_qty_base: Numeric4;
  batch_id: Uuid;
}

export interface PurchaseReceiptResult {
  inventory_txn_id: Uuid;
  purchase_order_status: PurchaseOrderStatus;
  lines: PurchaseReceiptResultLine[];
  trace_id?: string;
}

// ---------------------------------------------------------------------------
// Supplier payments (Cloud)
// ---------------------------------------------------------------------------

export interface RecordSupplierPaymentRequest {
  supplier_id: Uuid; // must equal PO supplier
  purchase_order_id: Uuid;
  amount: Money; // >0 and <= outstanding
  currency_code: string;
  method: SupplierPaymentMethod;
  payment_reference?: string | null;
  note?: string | null;
}

export interface SupplierPaymentDto {
  supplier_payment_id: Uuid;
  supplier_id: Uuid;
  purchase_order_id: Uuid;
  amount: Money;
  currency_code: string;
  method: SupplierPaymentMethod;
  payment_reference: string | null;
  note: string | null;
  paid_at: Timestamp;
  recorded_by_employee_id: Uuid;
  po_paid_amount: Money;
  po_outstanding_amount: Money;
  po_payment_status: PurchaseOrderPaymentStatus;
}

// ---------------------------------------------------------------------------
// Vendor returns (create/post on BranchLocal; reads also on Cloud)
// ---------------------------------------------------------------------------

export interface VendorReturnLineRequest {
  purchase_order_line_id: Uuid;
  batch_id: Uuid;
  location_id: Uuid;
  quantity_base: Numeric4; // <= accepted received stock still available
  reason_code?: string | null;
}

export interface CreateVendorReturnRequest {
  supplier_id: Uuid;
  branch_id: Uuid;
  reason_code?: string | null;
  note?: string | null;
  lines: VendorReturnLineRequest[]; // min 1
}

export interface VendorReturnLineDto {
  vendor_return_line_id: Uuid;
  purchase_order_line_id: Uuid;
  product_id: Uuid;
  batch_id: Uuid;
  location_id: Uuid;
  quantity_base: Numeric4;
  unit_cost_snapshot: Numeric4;
  reason_code: string | null;
}

export interface VendorReturnDto {
  vendor_return_id: Uuid;
  return_no: string;
  supplier_id: Uuid;
  branch_id: Uuid;
  created_by_employee_id: Uuid;
  status: VendorReturnStatus;
  reason_code: string | null;
  note: string | null;
  created_at: Timestamp;
  posted_at: Timestamp | null;
  lines: VendorReturnLineDto[];
  inventory_txn?: InventoryTxnDto; // VENDOR_RETURN_OUT after POST
}

// Role vocabulary re-export (keeps domain imports tidy)
export type { Role, BranchScope };
