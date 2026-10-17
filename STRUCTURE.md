# STRUCTURE.md
 
Single source of truth for where files go in the frontend.
Frontend only. Stack: Vite + React + TypeScript + react-router. No Next.js anywhere in the project (the backend is .NET).
Unless stated otherwise, every path below is relative to `src/`.
 
## 1. Folder tree
 
```
src/
├── main.tsx
├── index.css                      Tailwind entry
│
├── contracts/                     Phase 0 backend contracts (System of Record)
│   ├── openapi.erp.yaml           authoritative OpenAPI 3.0 specification
│   ├── schemas/                   domain JSON schemas (auth, catalog, common, identity, inventory, purchasing, sales)
│   ├── fixtures/                  canonical mock payloads & test suite (contract-fixtures.test.ts)
│   └── README.md                  contracts governance & validation guide
│
├── routes/                        routing
│   ├── router.tsx                 ALL routes are defined here
│   ├── paths.ts                   path constants
│   ├── ProtectedRoute.tsx
│   └── RoleGate.tsx
│
├── layouts/
│   └── AppShell.tsx               header, sidebar, <Outlet />
│
├── features/                      one folder per domain module
│   ├── auth/                      login, token refresh lifecycle, user context & branch selection
│   ├── sales/                     Stage 2: POS cashier checkout, invoices, sales returns & refunds
│   ├── purchasing/                Stage 3: suppliers, purchase orders, one-step receiving, payments & vendor returns
│   ├── products/                  Stage 1: catalog, categories, pricing, barcodes, UOMs, reorder rules
│   ├── inventory/                 Stage 1: inventory ledger, batch tracking (FEFO), balances & adjustments
│   └── ai/                        pages: insights, assistant, approvals (Brain service)
│       └── <each feature contains only the subfolders it requires>
│           ├── pages/
│           ├── components/
│           ├── hooks/             TanStack Query hooks and query keys
│           ├── api/               one API file per feature
│           └── schemas/           Zod validation schemas
│
├── components/                    shared across features
│   ├── ui/                        design system: Button, Input, Card, Badge, Modal
│   └── ai/                        InsightCard, ForecastChart, AssistantChatPanel, ApprovalModal
│
├── lib/
│   ├── api/
│   │   └── client.ts              the single Axios instance and interceptors
│   ├── queryClient.ts             the single QueryClient and its defaults
│   └── auth/
│       ├── tokenStorage.ts        the only file that touches browser storage
│       └── permissions.ts         role to permission map
│
├── test/                          shared test harness and MSW
│   ├── renderWithProviders.tsx
│   └── handlers.ts
│
├── hooks/                         generic custom hooks, shared by several features
│   ├── useAuth.ts
│   └── useDebounce.ts             (example of a generic hook)
│
├── stores/                        Zustand: exactly two stores
│   ├── cartStore.ts
│   └── authStore.ts
│
├── types/
│   ├── generated/                 generated from src/contracts (NEVER hand-edited)
│   │   ├── auth.ts, catalog.ts, common.ts, identity.ts
│   │   ├── inventory.ts, purchasing.ts, sales.ts, index.ts
│   │   └── tsconfig.json
│   ├── api.ts                     short aliases of generated contract types
│   └── ui.ts                      frontend-only types
│
└── assets/
```
 
Create subfolders only when you have a file to put in them. No empty folders.
 
## 2. Where each kind of file goes
 
| What | Where |
| --- | --- |
| A screen | `features/<feature>/pages/<Name>Page.tsx` |
| A component used by one feature | `features/<feature>/components/` |
| A component used by several features | Do not create it. Ask the developer (see section 5) |
| A generic building block | `components/ui/` (design system owner only) |
| An AI surface component | `components/ai/` (AI owner only) |
| A query or mutation hook and its query keys | `features/<feature>/hooks/` |
| A hook used by one feature only | `features/<feature>/hooks/` |
| An API function | `features/<feature>/api/<feature>Api.ts` |
| A Zod validation schema | `features/<feature>/schemas/<name>Schema.ts` |
| The Axios instance | `lib/api/client.ts` |
| The QueryClient | `lib/queryClient.ts` |
| Token storage and permissions | `lib/auth/` |
| `useAuth` | `hooks/useAuth.ts` |
| A generic custom hook (shared by several features, no API calls) | `hooks/use<Name>.ts` |
| A Zustand store | `stores/<name>Store.ts` |
| A route, a protected route, a path constant | `routes/` |
| A layout | `layouts/` |
| A frontend-only type | `types/ui.ts`, or next to the component that uses it |
| Contracts & OpenAPI spec (read-only) | `contracts/` (`openapi.erp.yaml`, `schemas/`, `fixtures/`) |
| Generated API domain types (read-only) | `types/generated/` (mirroring backend contracts) |
| A component or hook unit test | Next to the file it tests: `Name.test.tsx` |
| Shared test harness & mock handlers | `test/renderWithProviders.tsx`, `test/handlers.ts` |
| A Playwright E2E test | `tests/e2e/` at the repo root, outside the frontend app |
 
**Hooks:** a hook used by one feature stays inside that feature's `hooks/` folder. `hooks/` at the top level is only for generic hooks shared by several features (`useAuth`, `useDebounce`, `useMediaQuery`...). Hooks in `hooks/` never call the API and never hold server data.
 
Each AI page lives in `features/ai/pages/`. The routes are plain react-router routes (for example `/insights`, `/assistant`, `/approvals`), registered in `routes/router.tsx`. There are no route groups.
 
## 3. Ownership map
 
| Folder | Owner |
| --- | --- |
| `routes/`, `layouts/`, `lib/`, `hooks/`, `stores/` | Omar |
| `features/sales/`, `features/purchasing/` | Omar |
| `tests/e2e/` at the repo root (suite, config, helpers) | Omar |
| `features/products/`, `features/inventory/` | Maged |
| `components/ui/`, `components/ai/`, `features/ai/` | Mahmoud |
| `features/auth/` (login page) | Ahmed Salah |
| `features/customers/` | **EXCLUDED FROM MVP** (Walk-in Cashier sales only; no customer CRM) |
| `contracts/` | Canonical Backend Handover (Read-only System of Record) |
| `types/generated/` | Generated via tooling, nobody edits it by hand |
 
## 4. Naming
 
| Kind | Rule | Example |
| --- | --- | --- |
| Component file | PascalCase, same name as the component | `SaleRow.tsx` |
| Page file | PascalCase ending in `Page` | `PosPage.tsx` |
| Hook file | camelCase starting with `use` | `useSales.ts` |
| Query keys file | `<feature>Keys.ts` | `salesKeys.ts` |
| API file | `<feature>Api.ts` | `salesApi.ts` |
| Store file | `<name>Store.ts`; hook `use<Name>Store` | `cartStore.ts` |
| Test file | Same name plus `.test` | `SaleRow.test.tsx` |
| Folders | lowercase | `features/sales/` |
| Constants | `UPPER_SNAKE_CASE` | `DEFAULT_PAGE_SIZE` |
| Types and interfaces | PascalCase, no `I` prefix | `SaleFilters` |
| Environment variables | Start with `VITE_` | `VITE_API_BASE_URL` |
 
One component per file. Use named exports unless a file already follows a different convention.
 
## 5. Import direction
 
A folder may import only from the folders listed next to it. No circular imports.
 
| Folder | May import from |
| --- | --- |
| `features/<x>` | `components/ui`, `components/ai`, `hooks`, `lib`, `stores`, `types`. **Never** from another feature, except the exception below |
| `components/ui` | `types`, `lib` (helpers only). **Never** from `features`, `components/ai`, or `stores` |
| `components/ai` | `components/ui`, `types` |
| `lib` | `types`, `stores` (for `client.ts` reading token via `useAuthStore.getState()`) |
| `stores` | `types` only |
| `hooks` | `lib`, `stores`, `types`. **Never** from `features` or `components` |
| `routes` | `features/*/pages`, `layouts`, `hooks`, `lib/auth` |
| `layouts` | `components`, `hooks`, `lib/auth` |
| `types` | Nothing |
 
**Cross-feature exception (read-only data only):**
A feature may import from another feature ONLY through that feature's public barrel (`features/<x>/index.ts`), and ONLY the items allowed below.
 
- Allowed: read-only query hooks (`useQuery` based) and types.
- Forbidden: mutation hooks, API functions, stores, components, pages, and deep imports such as `features/products/hooks/...`. Always import from the barrel (`features/products`).
- The barrel belongs to the owner of the exporting feature. The importing feature never edits another feature's barrel or files. If a hook you need is not exported, tell the developer so he can ask the owner to export it.

| Importing feature | May import from |
| --- | --- |
| `sales`           | `products`      |
| `purchasing`      | `products`      |

Any other pair needs the developer's approval and a new row in this table.
 
Apart from this exception, hooks and API files inside a feature are imported by that feature's own pages and components only.
If two features need the same piece and it is not covered by the exception, do not import across features and do not copy it. Ask the developer how to share it.
 
## 6. Environment
 
- Values are read only through `import.meta.env.VITE_*`.
- `.env.example` belongs to infrastructure (Ali). Real `.env` files are never committed.
- Anything with the `VITE_` prefix is public in the browser bundle. No secrets.
## 7. Scope Boundaries & MVP Invariants

1. **Excluded from MVP (Out of Scope per ERP-Backend-Blueprint-v1.1.md):**
   - **Customer CRM / Accounts Receivable:** Retail POS is strictly walk-in cashier transactions. No `features/customers/` folder is to be created.
   - **Multi-step Goods Receipt:** Stage 3 strictly enforces atomic **One-Step Receiving** (`PURCHASE_RECEIPT` directly creates batches and ledger rows).
   - **General Ledger / Double-Entry:** Accounting is ledger-backed stock movements only, not full GL.
   - **Controlled Substances / Prescriptions:** Standard retail pharmacy inventory only.

2. **Runtime Deployment Topology (Cloud vs. BranchLocal):**
   - The POS cashier flow (`features/sales`) is designed to operate against a **Branch-Local API** instance to ensure continuous offline capability.
   - Administrative, catalog, purchasing, and reporting views operate against the central **Cloud ERP API**.

3. **External Brain / AI Client:**
   - As recorded in §13 of the Blueprint, Brain endpoints (`/api/v1/brain/*`) are separate from the core Pharmacy ERP backend. The ERP frontend interacts with the core ERP API via `lib/api/client.ts`. A dedicated Brain client configuration will be introduced when Brain endpoints are provisioned.