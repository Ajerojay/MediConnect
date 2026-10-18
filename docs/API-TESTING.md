# API Testing

Base URL: `http://localhost:4000/api/v1`. Start the application with `npm run dev` before testing.

## Postman

1. Import `postman/MediConnect.postman_collection.json`.
2. Open collection Variables. Set patientEmail/patientPassword, doctorEmail/doctorPassword and adminEmail/adminPassword to local configured accounts. Use an existing patient and an active doctor.
3. Run Authentication first. Scripts save separate role tokens.
4. Run Patients CRUD and Doctors CRUD to verify full resource lifecycles using newly created synthetic records.
5. Run Appointments to demonstrate POST, GET, PUT, PATCH and DELETE. PUT requires startsAt, reason and notes; notes may be null. PATCH preserves omitted values. DELETE returns 204 with an empty body; a follow-up GET returns 404.
6. Run Consultation Records, User Administration and Validation/Access Control.

Requests include assertions for expected status codes and exclusion of password hashes. Invalid credentials/missing tokens must return 401; role violations return 403; invalid DTOs return 422; malformed JSON returns 400; conflicts return 409. These are intended error responses, not server failures.

The appointment must remain PENDING during the five-method demo. Approval and medical-record creation are a separate workflow. A completed consultation appointment remains in history when testing manually; the automated runner removes only its own synthetic verification records afterwards.

## Automated run

`npm run test:api` runs the submitted collection through pinned Newman CLI tooling downloaded to the npm cache. The first run requires internet; Newman is kept outside the application dependency tree. It reads account credentials from the ignored .env and writes a sanitized summary to `docs/VERIFICATION.json`. It creates and removes only known verification records. Never run destructive test collections against real patient data.

## Code walkthrough

For a booking, open `backend/src/appointments/appointments.ts`. The controller receives JSON, the Zod pipe validates it, the service checks the patient and doctor availability, and the TypeORM repository/transaction writes MySQL. Follow the saved appointment back to the response. Entity relationships are in `backend/src/database/entities.ts`.

## Database check

Connect a MySQL client using the local connection settings. Inspect the appointments table before and after PUT/PATCH, matching the ID returned by POST. After DELETE, the same ID should no longer exist. Do not expose the populated .env or password hashes in screenshots or recordings.
