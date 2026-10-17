/**
 * Pharmacy ERP — Catalog contract (Stage 1). Mirrors schemas/catalog.json.
 *
 * KEY RULES:
 *  - UOM mutation is ADDITIVE / item-level only. No full-list PUT, no hard
 *    delete — deactivate via PATCH is_active=false.
 *  - conversion_to_base and is_base become IMMUTABLE once referenced by a
 *    posted document or stock (server rejects the change, 409).
 *  - For a sellable UOM, sale_unit_price is required/non-null/>=0. That price
 *    (+ PRODUCT.tax_rate) is the AUTHORITATIVE POS pricing source. There is
 *    NO branch price list, promotion, or rule-based pricing in the MVP.
 *  - tax_rate is fractional: "0.1400" == 14%.
 *  - Reorder rules are read/config only — never auto-create POs.
 */
import type { Uuid, Timestamp, Numeric4, Numeric6, TaxRate } from './common';

// ---------------------------------------------------------------------------
// ProductCategory
// ---------------------------------------------------------------------------

export interface ProductCategoryDto {
  category_id: Uuid;
  parent_category_id: Uuid | null; // no self-parent
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ProductCategoryRequest {
  parent_category_id?: Uuid | null;
  code: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
}

export interface ProductCategoryPatchRequest {
  parent_category_id?: Uuid | null;
  code?: string;
  name?: string;
  description?: string | null;
  is_active?: boolean;
}

// ---------------------------------------------------------------------------
// Product / UOM
// ---------------------------------------------------------------------------

export interface ProductUomDto {
  product_uom_id: Uuid;
  uom_code: string;
  display_name: string;
  conversion_to_base: Numeric6; // >0; immutable once referenced
  sale_unit_price: Numeric4 | null;
  is_base: boolean; // exactly one active base per product, factor = 1
  is_sellable: boolean;
  is_purchasable: boolean;
  is_active: boolean;
}

export interface ProductUomRequest {
  uom_code: string;
  display_name: string;
  conversion_to_base: Numeric6;
  sale_unit_price?: Numeric4 | null;
  is_base?: boolean;
  is_sellable?: boolean;
  is_purchasable?: boolean;
}

export interface ProductUomPatchRequest {
  display_name?: string;
  sale_unit_price?: Numeric4 | null;
  is_sellable?: boolean;
  is_purchasable?: boolean;
  is_active?: boolean;
}

/** Representative of { product_id, uom_code, factor, price, is_base, active } */
export type ProductUomListItem = ProductUomDto;

export interface ProductDto {
  product_id: Uuid;
  category_id: Uuid;
  sku: string;
  barcode: string | null;
  name: string;
  generic_name: string | null;
  brand_name: string | null;
  base_uom_code: string; // matches the single active is_base UOM
  tax_rate: TaxRate; // fractional 0..1
  image_url: string | null;
  lot_tracking_required: boolean; // cannot change while stock/history exists
  expiry_alert_days: number; // >=0
  is_active: boolean;
  uoms: ProductUomListItem[];
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CreateProductRequest {
  category_id: Uuid;
  sku: string;
  barcode?: string | null;
  name: string;
  generic_name?: string | null;
  brand_name?: string | null;
  base_uom_code: string;
  tax_rate?: TaxRate; // default "0.0000"
  image_url?: string | null;
  lot_tracking_required?: boolean;
  expiry_alert_days?: number; // default 0
  uoms: ProductUomRequest[]; // exactly one is_base=true with conversion_to_base=1
}

export interface ProductPatchRequest {
  category_id?: Uuid;
  barcode?: string | null;
  name?: string;
  generic_name?: string | null;
  brand_name?: string | null;
  tax_rate?: TaxRate;
  image_url?: string | null;
  lot_tracking_required?: boolean;
  expiry_alert_days?: number;
  is_active?: boolean;
}

// ---------------------------------------------------------------------------
// Reorder rule (config only)
// ---------------------------------------------------------------------------

export interface ReorderRuleDto {
  reorder_rule_id: Uuid;
  product_id: Uuid;
  branch_id: Uuid;
  reorder_point_base: Numeric4; // base units
  reorder_quantity_base: Numeric4; // base units
  max_quantity_base: Numeric4 | null; // >= reorder_point_base if present
  is_active: boolean;
}

export interface ReorderRuleRequest {
  product_id: Uuid;
  branch_id: Uuid;
  reorder_point_base: Numeric4;
  reorder_quantity_base: Numeric4;
  max_quantity_base?: Numeric4 | null;
  is_active?: boolean;
}

/** GET /branches/{branchId}/products/{productId}/reorder-rule */
export interface ReorderRuleWrapper {
  rule: ReorderRuleDto; // null when none configured
}
