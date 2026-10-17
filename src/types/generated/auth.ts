/**
 * Pharmacy ERP — Auth contract (Stage 1). Mirrors schemas/auth.json.
 *
 * - Username uniqueness is PER-ORGANIZATION (login resolves organization_code).
 * - Refresh rotates on every use; submitting a consumed refresh token revokes
 *   its whole token family -> FE must force re-login.
 * - Branch-local runtime: access tokens max 24h validity, constrained to the
 *   enrolled branch.
 */
import type {
  Uuid,
  Role,
  BranchScope,
  PermissionScope,
  RuntimeMode,
  AuthMetadata,
} from './common';
import type { UserDto } from './identity';

export interface LoginRequest {
  organization_code: string;
  username: string;
  password: string;
}

export interface TokenPairResponse extends AuthMetadata {
  access_token: string;
  refresh_token: string;
  /** access-token lifetime seconds; branch-local offline max 86400 */
  expires_in: number;
  token_type: 'Bearer';
  user: UserDto;
  organization_id: Uuid;
  branch_scope: BranchScope;
  /** explicit branches; empty[] with branch_scope=ALL means ALL organization branches */
  branch_ids: Uuid[];
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string | null;
}

export interface CurrentUserContext {
  user: UserDto;
  organization_id: Uuid;
  organization_code: string;
  branch_scope: BranchScope;
  branch_ids: Uuid[];
  roles: Role[];
  scopes: PermissionScope[];
  runtime: RuntimeMode;
  issuance_context: Record<string, unknown>;
}
