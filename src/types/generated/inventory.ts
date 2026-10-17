/**
 * Pharmacy ERP — Inventory contract (Stage 1). Mirrors schemas/inventory.json.
 *
 * KEY RULES:
 *  - The ledger (transactions + lines) is APPEND-ONLY and authoritative;
 *    STOCK_BALANCE is a projection. No user edits balances directly.
 *  - POSTED transactions and their lines are immutable (DB-enforced).
 *    Corrections go through REVERSAL or ADJUSTMENT transactions.
 *  - Ledger lines are always in the product BASE UOM
 *    (entered_qty = |quantity_delta_base|, conversion_snapshot = 1).
 *  - Opening balance is a BRACH-LOCAL command; the cloud never sends stock.
 *  - Batches are read-only via API (created by ledger workflows).
 */
import type {
  Uuid,
  Timestamp,
  Numeric4,
  Numeric6,
  BusinessDate,
} from './common';

// ---------------------------------------------------------------------------
// Enums / value sets (closed sets, case-sensitive)
// ---------------------------------------------------------------------------

export type LocationType = 'SELLABLE' | 'QUARANTINE' | 'DAMAGED' | 'SCRAP';

export type BatchQualityStatus =
  'AVAILABLE' | 'QUARANTINED' | 'EXPIRED' | 'RECALLED';

export type InventoryTxnType =
  | 'OPENING_BALANCE' // + lines; requires authorized per-line unit cost
  | 'ADJUSTMENT_IN' // + lines; requires authorized per-line unit cost
  | 'ADJUSTMENT_OUT' // - lines; server uses current balance cost
  | 'SALE_ISSUE' // - lines (Stage 2)
  | 'SALES_RETURN_IN' // + lines (Stage 2)
  | 'PURCHASE_RECEIPT' // + lines (Stage 3)
  | 'VENDOR_RETURN_OUT' // - lines (Stage 3)
  | 'SCRAP_OUT' // - lines, paired atomically with SALES_RETURN_IN
  | 'REVERSAL'; // exactly negates reverses_inventory_txn_id target

export type InventoryTxnStatus = 'DRAFT' | 'POSTED' | 'CANCELLED';

/** Types permissible on POST /api/v1/inventory/adjustments */
export type AdjustmentsTxnType =
  'OPENING_BALANCE' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'REVERSAL';

// ---------------------------------------------------------------------------
// Locations & batches
// ---------------------------------------------------------------------------

export interface InventoryLocationDto {
  location_id: Uuid;
  branch_id: Uuid;
  location_code: string;
  name: string;
  location_type: LocationType; // is_sellable=true only for SELLABLE
  is_sellable: boolean;
  is_active: boolean;
}

export interface InventoryLocationRequest {
  branch_id: Uuid;
  location_code: string;
  name: string;
  location_type: LocationType;
  is_active?: boolean;
}

export interface InventoryLocationPatchRequest {
  name?: string;
  location_type?: LocationType;
  is_active?: boolean;
}

export interface InventoryBatchDto {
  batch_id: Uuid; // deterministic UUIDv5, identical across branches
  product_id: Uuid;
  batch_number: string; // exact, case-sensitive
  manufactured_on: BusinessDate | null;
  expires_on: BusinessDate | null; // required for lot-tracked products
  quality_status: BatchQualityStatus;
  is_non_lot?: boolean; // NON-LOT sentinel (lot_tracking_required=false)
}

// ---------------------------------------------------------------------------
// Balances (projection; no reserved quantity in MVP)
// ---------------------------------------------------------------------------

export interface InventoryBalanceDto {
  product_id: Uuid;
  branch_id: Uuid;
  location_id: Uuid;
  batch_id: Uuid;
  on_hand_qty_base: Numeric4; // >= 0 always
  average_unit_cost: Numeric4; // location-and-batch weighted average
  available_qty_base: Numeric4; // eligible stock; == on_hand in MVP
  row_version?: number;
  updated_at: Timestamp;
}

// ---------------------------------------------------------------------------
// Ledger (authoritative)
// ---------------------------------------------------------------------------

export interface InventoryTxnLineDto {
  inventory_txn_line_id: Uuid;
  product_id: Uuid;
  location_id: Uuid;
  batch_id: Uuid; // NON-LOT sentinel for non-lot products
  product_uom_id: Uuid; // product base UOM for ledger lines
  entered_qty: Numeric4; // = |quantity_delta_base|
  conversion_snapshot: Numeric6; // = 1
  quantity_delta_base: Numeric4; // signed; never 0
  unit_cost_base: Numeric4 | null;
  sales_order_line_id: Uuid | null;
  sales_return_line_id: Uuid | null;
  purchase_order_line_id: Uuid | null;
  vendor_return_line_id: Uuid | null;
}

/** Source-document links present exactly one per txn type (DB CHECK) */
export interface InventoryTxnDto {
  inventory_txn_id: Uuid;
  branch_id: Uuid;
  transaction_no: string;
  transaction_type: InventoryTxnType;
  status: InventoryTxnStatus;
  reason_code: string | null;
  note: string | null;
  posted_at: Timestamp | null;
  created_by_employee_id: Uuid;
  reverses_inventory_txn_id: Uuid | null;
  sales_order_id: Uuid | null;
  sales_return_id: Uuid | null;
  purchase_order_id: Uuid | null;
  vendor_return_id: Uuid | null;
  lines: InventoryTxnLineDto[];
}

// ---------------------------------------------------------------------------
// Adjustment command (opening balance / corrections)
// ---------------------------------------------------------------------------

export interface InventoryTxnLineRequest {
  product_id: Uuid;
  location_id: Uuid;
  /** Use the system NON-LOT batch id for non-lot-tracked products. */
  batch_id: Uuid;
  product_uom_id: Uuid; // typically the base UOM
  entered_qty: Numeric4; // > 0 in the entered UOM
  /** REQUIRED for ADJUSTMENT_IN / OPENING_BALANCE; server decides ADJUSTMENT_OUT.
   *  Reversals / RESTOCK returns reuse original posted cost automatically. */
  unit_cost_base?: Numeric4 | null;
}

export interface InventoryTxnRequest {
  transaction_type: AdjustmentsTxnType;
  branch_id: Uuid;
  reason_code?: string | null;
  note?: string | null;
  /** REQUIRED when transaction_type === "REVERSAL" */
  reverses_inventory_txn_id?: Uuid | null;
  lines: InventoryTxnLineRequest[]; // min 1
}

// ---------------------------------------------------------------------------
// FE list filters
// ---------------------------------------------------------------------------

export interface BalanceQuery {
  branchId: Uuid; // required
  productId?: Uuid;
  locationId?: Uuid;
  batchId?: Uuid;
}

export interface TxnHistoryQuery {
  branchId: Uuid; // required
  transactionType?: InventoryTxnType;
  productId?: Uuid;
  from?: Timestamp;
  to?: Timestamp;
}
