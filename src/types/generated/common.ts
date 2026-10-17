/**
 * Pharmacy ERP — Shared Contract Primitives (mirrors schemas/common.json)
 *
 * CRITICAL NOTE ON NUMBERS:
 *   Money / quantities / costs / tax rates / conversion factors are serialized
 *   as fixed-decimal STRINGS, not IEEE-754 floats. Do NOT convert them to
 *   `number` for arithmetic you submit back to the server — the server is
 *   authoritative for all totals. Parse to decimal lib (e.g. decimal.js) only
 *   for display.
 */

export type Uuid = string;
/** numeric(18,2) — fixed-2 decimal string */
export type Money = string;
/** numeric(18,4) — fixed-4 decimal string (quantities, unit costs) */
export type Numeric4 = string;
/** numeric(18,6) — fixed-6 decimal string (conversion factors) */
export type Numeric6 = string;
/** numeric(9,4) fractional rate: "0.1400" = 14% (NOT 14) */
export type TaxRate = string;
/** UTC ISO-8601 timestamptz */
export type Timestamp = string;
/** Business date, organization-timezone-derived */
export type BusinessDate = string; // "YYYY-MM-DD"

export interface AddressDto {
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postal_code: string | null;
  country_code: string; // "EG"
}

// ---------------------------------------------------------------------------
// Auth vocabulary (case-sensitive closed sets)
// ---------------------------------------------------------------------------

export type Role = 'Admin' | 'Pharmacist' | 'Cashier';
export type BranchScope = 'ALL' | 'ASSIGNED';
export type RuntimeMode = 'Cloud' | 'BranchLocal';

export type PermissionScope =
  | 'inventory:read'
  | 'inventory:write'
  | 'sales:read'
  | 'sales:write'
  | 'return:read'
  | 'return:write'
  | 'purchase-order:read'
  | 'purchase-order:draft'
  | 'purchase-order:approve'
  | 'purchase-order:receive'
  | 'supplier-payment:write'
  | 'sync:retry'
  | 'user:admin';

/** JWT claims shape (verified payload) — §8.5 */
export interface JwtClaims {
  sub: Uuid;
  roles: Role[];
  organization_id: Uuid;
  branch_scope: BranchScope;
  branch_ids: Uuid[];
  scopes: PermissionScope[];
  iat: number;
  exp: number;
}

// ---------------------------------------------------------------------------
// Error envelope — every code maps to exactly ONE HTTP status
// ---------------------------------------------------------------------------

export type ApiErrorCode =
  | 'MALFORMED_REQUEST' // 400
  | 'UNAUTHORIZED' // 401
  | 'FORBIDDEN' // 403
  | 'FORBIDDEN_BRANCH'; // 403 (branch scope failure)

export type ApiErrorCodeConflicts =
  | 'NOT_FOUND' // 404
  | 'CONFLICT' // 409
  | 'INVALID_STATE_TRANSITION' // 409
  | 'OUT_OF_STOCK' // 409
  | 'IDEMPOTENCY_MISMATCH'; // 409

export type ApiErrorCodeValidations =
  | 'VALIDATION_ERROR' // 422
  | 'EXPIRY_POLICY_VIOLATION'; // 422

export type ApiErrorCodeAll =
  | ApiErrorCode
  | ApiErrorCodeConflicts
  | ApiErrorCodeValidations
  | 'INTERNAL_ERROR'; // 500

export interface ApiErrorDetail {
  field: string; // JSON path, e.g. "lines[0].quantity"
  issue: string;
}

export interface ApiError {
  error: {
    code: ApiErrorCodeAll;
    message: string;
    details?: ApiErrorDetail[];
    trace_id: string; // matches the W3C traceparent sent on the call
  };
}

/** 409 with per-line stock detail on checkout */
export interface OutOfStockError extends ApiError {
  error: {
    code: 'OUT_OF_STOCK';
    message: string;
    details: ApiErrorDetail[]; // which lines were short
    trace_id: string;
  };
}

// ---------------------------------------------------------------------------
// Pagination — one shape for every list endpoint
// ---------------------------------------------------------------------------

export interface PagedResult<T> {
  items: T[];
  /** Opaque cursor; null means end of results */
  nextCursor: string | null;
}

// ---------------------------------------------------------------------------
// HTTP contract helpers
// ---------------------------------------------------------------------------

/** Attach to every mutating request */
export interface MutationHeaders {
  'Idempotency-Key': string; // stable per logical operation; min 16, max 100 chars
  traceparent?: string; // W3C trace context
}

export interface AuthHeaders extends MutationHeaders {
  Authorization: `Bearer ${string}`;
}

/** Server-issued JWT metadata to keep alongside tokens */
export interface AuthMetadata {
  issuer: string; // iss
  audience: string; // aud
  key_id: string; // kid -> validate via GET /.well-known/jwks.json
}
