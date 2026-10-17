/**
 * Pharmacy ERP — Sales contract (Stage 2, BranchLocal runtime POS).
 * Mirrors schemas/sales.json.
 *
 * ABSOLUTE FE RULES (server authority):
 *  - FE sends ONLY product_id + product_uom_id + entered_qty. Prices, tax,
 *    discounts, totals, and change are server-computed. FE totals are
 *    informational only.
 *  - Drafts do NOT reserve or decrement stock.
 *  - Complete = cash payment in FULL (method CASH only).
 *  - The server allocates stock FEFO; insufficient stock -> 409 OUT_OF_STOCK
 *    with affected line details.
 *  - Returns: FE picks invoice line + quantity + disposition ONLY. Batch and
 *    destination location are derived by the server from the original posted
 *    sale allocation. 14-day window (organization tz), must be at the
 *    invoice branch.
 *  - Invoices are immutable after issue; corrections are NEW returns.
 */
import type {
  Uuid,
  Timestamp,
  Money,
  Numeric4,
  Numeric6,
  TaxRate,
} from './common';
import type { InventoryTxnDto } from './inventory';

// ---------------------------------------------------------------------------
// Closed value sets
// ---------------------------------------------------------------------------

export type SalesOrderStatus = 'DRAFT' | 'COMPLETED' | 'CANCELLED';
export type InvoiceStatus = 'ISSUED';
export type InvoicePaymentStatus = 'PAID' | 'PARTIALLY_REFUNDED' | 'REFUNDED';
export type PaymentMethod = 'CASH'; // MVP: cash only
export type ReturnDisposition = 'RESTOCK' | 'QUARANTINE' | 'SCRAP';
export type SalesReturnStatus = 'DRAFT' | 'POSTED' | 'CANCELLED';
export type SalesRefundStatus =
  'NOT_REFUNDED' | 'PARTIALLY_REFUNDED' | 'REFUNDED';

// ---------------------------------------------------------------------------
// Orders (draft cart)
// ---------------------------------------------------------------------------

export interface SalesOrderLineDto {
  order_line_id: Uuid;
  product_id: Uuid;
  product_uom_id: Uuid;
  entered_qty: Numeric4;
  conversion_snapshot: Numeric6;
  quantity_base: Numeric4;
  unit_price_snapshot: Numeric4; // per entered UOM
  discount_amount: Money; // always 0 in MVP
  tax_rate_snapshot: TaxRate; // fractional
  tax_amount_snapshot: Money;
  line_total: Money; // = net + tax
}

export interface SalesOrderDto {
  sales_order_id: Uuid;
  branch_id: Uuid;
  created_by_employee_id: Uuid;
  order_no: string;
  channel: 'POS';
  order_status: SalesOrderStatus;
  currency_code: string; // = Organization base_currency
  estimated_subtotal: Money;
  estimated_tax_total: Money;
  estimated_grand_total: Money;
  created_at: Timestamp;
  completed_at: Timestamp | null;
  lines: SalesOrderLineDto[];
}

export interface SalesOrderLineRequest {
  product_id: Uuid;
  product_uom_id: Uuid;
  entered_qty: Numeric4;
}

export interface CreateSalesOrderRequest {
  branch_id: Uuid;
  lines: SalesOrderLineRequest[]; // min 1
}

export interface SalesOrderLinesRequest {
  lines: SalesOrderLineRequest[]; // min 1; DRAFT-only full replace
}

export interface CompleteSalesOrderRequest {
  /** >= payable; change = tendered - due >= 0; full payment only */
  cash_tendered_amount: Money;
  method: PaymentMethod;
}

export interface SalesPaymentDto {
  payment_id: Uuid;
  invoice_id: Uuid;
  amount_due: Money; // = exact invoice total
  cash_tendered_amount: Money;
  change_amount: Money; // tendered - due
  method: PaymentMethod;
  received_by_employee_id: Uuid;
  paid_at: Timestamp;
}

// ---------------------------------------------------------------------------
// Invoice (immutable snapshots + settlement projection)
// ---------------------------------------------------------------------------

export interface SalesInvoiceLineDto {
  invoice_line_id: Uuid;
  source_order_line_id: Uuid;
  product_id: Uuid;
  product_uom_id: Uuid;
  entered_qty: Numeric4;
  conversion_snapshot: Numeric6;
  quantity_base: Numeric4;
  unit_price_snapshot: Numeric4;
  discount_amount: Money;
  tax_rate_snapshot: TaxRate;
  tax_amount_snapshot: Money;
  net_amount: Money; // tax-exclusive
  line_total: Money; // tax-inclusive (the refundable base)
  unit_cost_snapshot: Numeric4; // weighted summary of actual batch allocations
}

export interface SalesInvoiceDto {
  invoice_id: Uuid;
  sales_order_id: Uuid;
  branch_id: Uuid;
  invoice_no: string;
  status: InvoiceStatus;
  currency_code: string;
  subtotal: Money;
  discount_total: Money;
  tax_total: Money;
  grand_total: Money;
  paid_amount: Money;
  refunded_amount: Money;
  payment_status: InvoicePaymentStatus;
  issued_at: Timestamp;
  lines: SalesInvoiceLineDto[];
  payments: SalesPaymentDto[];
  returns_summary?: SalesReturnDto[];
}

export interface CompleteSalesOrderResult {
  sales_order: SalesOrderDto;
  invoice: SalesInvoiceDto;
  payment: SalesPaymentDto;
  inventory_txn: InventoryTxnDto; // SALE_ISSUE
}

// ---------------------------------------------------------------------------
// Returns & refunds
// ---------------------------------------------------------------------------

export interface SalesReturnLineRequest {
  invoice_line_id: Uuid;
  /** <= remaining sold quantity for that allocation */
  quantity_base: Numeric4;
  disposition: ReturnDisposition;
}

export interface SalesReturnRequest {
  invoice_id: Uuid;
  reason_code: string;
  /** Optional distinct Admin/Pharmacist approver; must not be the receiver */
  approved_by_employee_id?: Uuid | null;
  lines: SalesReturnLineRequest[]; // min 1
  refund_requested?: boolean; // default true
}

export interface SalesReturnLineDto {
  return_line_id: Uuid;
  invoice_line_id: Uuid;
  product_id: Uuid;
  batch_id: Uuid; // server-derived from original sale allocation
  destination_location_id: Uuid; // server-selected
  quantity_base: Numeric4;
  refund_amount: Money; // proportional share of original tax-inclusive line_total
  disposition: ReturnDisposition;
}

export interface SalesRefundDto {
  refund_id: Uuid;
  sales_return_id: Uuid;
  invoice_id: Uuid;
  amount: Money; // capped by min(remaining paid, returned refundable value)
  method: PaymentMethod;
  processed_by_employee_id: Uuid;
  refunded_at: Timestamp;
}

export interface SalesReturnDto {
  return_id: Uuid;
  invoice_id: Uuid;
  branch_id: Uuid;
  return_no: string;
  status: SalesReturnStatus;
  reason_code: string | null;
  refund_amount: Money;
  refund_status: SalesRefundStatus;
  received_by_employee_id: Uuid;
  approved_by_employee_id: Uuid | null;
  received_at: Timestamp;
  lines: SalesReturnLineDto[];
  /** SALES_RETURN_IN (+ linked SCRAP_OUT when disposition=SCRAP) */
  inventory_txn?: InventoryTxnDto;
  refund?: SalesRefundDto;
}

export type { SalesReturnDto as SalesReturnInfo };
