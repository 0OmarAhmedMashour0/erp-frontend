/**
 * Pharmacy ERP — Authoritative API Type Aliases & Re-exports
 *
 * Strict architectural rule:
 * All domain types derive exclusively from `src/types/generated/`.
 * NO handwritten API shapes, NO duplicates, NO `any`.
 */

// 1. Full re-export of all generated domain contracts
export * from './generated';

// 2. Ergonomic domain entity aliases for UI and feature modules
import type {
  // Auth & Identity
  CurrentUserContext,
  TokenPairResponse,
  LoginRequest,
  OrganizationDto,
  BranchDto,
  EmployeeDto,
  UserDto,
  // Catalog & Inventory
  ProductDto,
  ProductUomDto,
  ProductCategoryDto,
  InventoryLocationDto,
  InventoryBatchDto,
  InventoryBalanceDto,
  InventoryTxnDto,
  InventoryTxnLineDto,
  // Sales & POS (Stage 2)
  SalesOrderDto,
  SalesOrderLineDto,
  SalesInvoiceDto,
  SalesInvoiceLineDto,
  SalesPaymentDto,
  SalesReturnDto,
  SalesReturnLineDto,
  SalesRefundDto,
  CompleteSalesOrderResult,
  // Purchasing & Suppliers (Stage 3)
  SupplierDto,
  PurchaseOrderDto,
  PurchaseOrderLineDto,
  SupplierPaymentDto,
  VendorReturnDto,
  VendorReturnLineDto,
  PurchaseReceiptResult,
} from './generated';

// Shorter, ergonomic aliases for frontend screens
export type CurrentUser = CurrentUserContext;
export type TokenPair = TokenPairResponse;
export type AuthCredentials = LoginRequest;

export type Organization = OrganizationDto;
export type Branch = BranchDto;
export type Employee = EmployeeDto;
export type User = UserDto;

export type Product = ProductDto;
export type ProductUom = ProductUomDto;
export type ProductCategory = ProductCategoryDto;
export type InventoryLocation = InventoryLocationDto;
export type InventoryBatch = InventoryBatchDto;
export type InventoryBalance = InventoryBalanceDto;
export type InventoryTxn = InventoryTxnDto;
export type InventoryTxnLine = InventoryTxnLineDto;

export type SaleOrder = SalesOrderDto;
export type SaleOrderLine = SalesOrderLineDto;
export type SaleInvoice = SalesInvoiceDto;
export type SaleInvoiceLine = SalesInvoiceLineDto;
export type SalePayment = SalesPaymentDto;
export type SaleReturn = SalesReturnDto;
export type SaleReturnLine = SalesReturnLineDto;
export type SaleRefund = SalesRefundDto;
export type CheckoutResult = CompleteSalesOrderResult;

export type Supplier = SupplierDto;
export type PurchaseOrder = PurchaseOrderDto;
export type PurchaseOrderLine = PurchaseOrderLineDto;
export type SupplierPayment = SupplierPaymentDto;
export type VendorReturn = VendorReturnDto;
export type VendorReturnLine = VendorReturnLineDto;
export type GoodsReceiptResult = PurchaseReceiptResult;

// Derived projection types for lists & tables (using Pick/Omit/Extract)
export type SaleInvoiceSummary = Pick<
  SalesInvoiceDto,
  | 'invoice_id'
  | 'invoice_no'
  | 'grand_total'
  | 'paid_amount'
  | 'payment_status'
  | 'issued_at'
>;

export type PurchaseOrderSummary = Pick<
  PurchaseOrderDto,
  | 'purchase_order_id'
  | 'po_no'
  | 'supplier_id'
  | 'status'
  | 'total_amount'
  | 'payment_status'
  | 'created_at'
>;

export type SupplierSummary = Pick<
  SupplierDto,
  'supplier_id' | 'supplier_code' | 'legal_name' | 'phone' | 'is_active'
>;
