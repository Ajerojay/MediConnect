# Architecture

MediConnect contains a NestJS backend and an optional Next.js web portal. Both use the same REST API; the browser has no direct database access.

```text
Postman ---------------------> NestJS Controller
Next.js Server Actions ------>        |
                                      v
                                  Service
                                      |
                                      v
                             TypeORM Repository
                                      |
                                      v
                                    MySQL
```

## Backend modules

Authentication issues signed JWTs and validates accounts. Patients, Doctors, Appointments, Medical Records and Users contain their own controllers and services. Resource repositories isolate TypeORM access. TypeORM entities define keys, relationships, column types and deletion policies.

Each authenticated request verifies the JWT, loads the current account, checks active status and applies role and ownership rules. Controller DTOs validate untrusted input with Zod. The global exception filter maps validation, authentication, missing-resource and relationship-conflict errors to consistent JSON responses.

Appointment creation locks the relevant doctor row inside a transaction before checking interval overlaps. Pending/approved appointments reserve time. Updates and status changes lock the current appointment. Medical-record creation locks its appointment, inserts the record and prescriptions, and completes the consultation atomically.

## Web portal

Server components load API data through `lib/api.ts`. Server actions call the NestJS API for mutations. Browser login stores the JWT in an HTTP-only, same-site cookie with a one-hour lifetime. API responses never include password hashes. The `/api/v1` Next.js route is a compatibility proxy; the authoritative backend is on port 4000.

## Local operation

`npm run dev` starts the locally managed MySQL instance when configured, the backend watcher and the portal. The local database lives under ignored `.local/`; generated builds and previous migration material are also excluded from version control. `npm run setup` creates the schema explicitly, while regular startup uses synchronization disabled.

## Scope

The source targets NestJS, TypeORM, MySQL, JWT, at least two CRUD modules and at least twenty REST endpoints. The optional frontend contains patient appointments/records, doctor scheduling/records and administrator directories. External Supabase and Resend services are not required.
