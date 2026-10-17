/**
 * Pharmacy ERP — Identity contract (Stage 1). Mirrors schemas/identity.json.
 *
 * organization_id is ALWAYS derived from the JWT — FE never submits it.
 * Soft deactivation only (is_active); no hard deletes.
 */
import type {
  Uuid,
  Timestamp,
  Role,
  BranchScope,
  BusinessDate,
  AddressDto,
} from './common';

// ---------------------------------------------------------------------------
// Organization
// ---------------------------------------------------------------------------

export interface OrganizationDto {
  organization_id: Uuid;
  organization_code: string;
  name: string;
  base_currency: string; // "EGP" seeded
  time_zone_id: string; // IANA, e.g. "Africa/Cairo"
  address: AddressDto;
  is_active: boolean;
}

export interface CreateOrganizationRequest {
  organization_code: string;
  name: string;
  base_currency: string;
  time_zone_id: string;
  address: AddressDto;
  branch: {
    code: string;
    name: string;
    address?: AddressDto;
  };
  admin: {
    employee_no: string;
    full_name: string;
    username: string;
    password: string;
  };
}

export interface OrganizationSetupResult {
  organization: OrganizationDto;
  branch: BranchDto;
  employee: EmployeeDto;
  user: UserDto;
  enrollment_setup_state: 'PENDING' | 'ENROLLED' | 'FAILED';
}

// ---------------------------------------------------------------------------
// Branch
// ---------------------------------------------------------------------------

export interface BranchDto {
  branch_id: Uuid;
  organization_id: Uuid;
  code: string;
  name: string;
  address?: AddressDto;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface BranchRequest {
  code: string;
  name: string;
  address: AddressDto;
  is_active?: boolean;
}

export interface BranchPatchRequest {
  name?: string;
  address?: AddressDto;
  is_active?: boolean;
}

// Branch runtime enrollment (single-use, short-lived token, stored hashed)
export interface EnrollmentTokenDto {
  enrollment_id: Uuid;
  token: string; // plain value returned exactly once
  expires_at: Timestamp;
}

export interface BranchEnrollmentRequest {
  token: string;
}

export interface BranchEnrollmentResult {
  organization_id: Uuid;
  branch_id: Uuid;
  runtime_credential: string;
  initial_cursor: string;
  credential_expires_at: Timestamp;
}

// ---------------------------------------------------------------------------
// Employee
// ---------------------------------------------------------------------------

export interface EmployeeDto {
  employee_id: Uuid;
  organization_id: Uuid;
  branch_id: Uuid; // home branch
  employee_no: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  hired_on: BusinessDate | null;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface EmployeeRequest {
  branch_id: Uuid;
  employee_no: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  job_title?: string | null;
}

export interface EmployeePatchRequest {
  branch_id?: Uuid;
  employee_no?: string;
  full_name?: string;
  email?: string | null;
  phone?: string | null;
  job_title?: string | null;
  hired_on?: BusinessDate | null;
  is_active?: boolean;
}

// ---------------------------------------------------------------------------
// User account (Admin-only endpoints)
// ---------------------------------------------------------------------------

export interface UserDto {
  user_id: Uuid;
  employee_id: Uuid | null;
  username: string; // unique per organization (immutable)
  role: Role;
  branch_scope: BranchScope;
  is_active: boolean;
  access_failed_count?: number;
  lockout_end?: Timestamp | null;
  last_login_at?: Timestamp | null;
}

export interface BranchAccessGrant {
  branch_id: Uuid;
  branch_code?: string;
}

export interface CreateUserRequest {
  employee_id: Uuid;
  username: string;
  password: string;
  role: Role;
  branch_scope: BranchScope;
  branch_access?: BranchAccessGrant[]; // required when branch_scope=ASSIGNED
}

export interface UserPatchRequest {
  role?: Role;
  branch_scope?: BranchScope;
  branch_access?: BranchAccessGrant[];
  is_active?: boolean;
}

export interface PasswordResetRequest {
  new_password: string;
}

export type Customer = never; // There is NO customer entity in the MVP
