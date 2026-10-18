# MediConnect

Hospital management backend with an optional web portal. The API uses NestJS, TypeORM, MySQL and JWT authentication; the portal uses Next.js and TypeScript.

## Requirements

- Node.js 22 or newer and npm.
- MySQL Server 8.0 or newer. On Windows, the local setup script detects the standard MySQL 8.0 installation. Other locations can be configured with MYSQL_SERVER_BINARY.
- The database and seed credentials are configured locally in .env and are excluded from Git.

## Run locally

1. Run `npm ci`.
2. Copy `.env.example` to `.env` and set the initial account emails/passwords. Leave the local database password and JWT secret blank for automatic generation.
3. Run `npm run setup`. This initializes a separate local MySQL database on port 3307 and creates the TypeORM schema and configured accounts. An existing MySQL server can be used instead by setting MYSQL_MANAGED_LOCAL=false and supplying its connection settings.
4. Run `npm run dev` (or `npm run start:dev`). This starts MySQL when locally managed, the NestJS API and the Next.js portal.

Default URLs: web portal `http://localhost:3000`; API `http://localhost:4000/api/v1`; health `http://localhost:4000/api/v1/health`. The local FRONTEND_PORT setting can select another available port. Keep the terminal open while using the application.

## Features

- JWT login, bcrypt password hashing, protected routes and role checks.
- Full GET, POST, PUT, PATCH and DELETE operations for patients, doctors, appointments and medical records.
- Patient appointment booking, doctor approval and consultation records with prescriptions.
- Administrator account status management and patient/doctor directories.
- Validated JSON input, ownership rules, transactional appointment conflict checks and consistent HTTP errors.
- Six related MySQL tables represented by TypeORM entities.

## API verification

Import `postman/MediConnect.postman_collection.json` into Postman. Configure the patient, doctor and administrator credentials in collection variables. Run the numbered folders in order. See [API testing](docs/API-TESTING.md).

With the local seed credentials configured and the server running, `npm run test:api` executes the same collection through Newman. Credentials and tokens are excluded from the saved verification summary.

## Quality and production commands

- `npm run check`: TypeScript and formatting checks.
- `npm run build`: compile NestJS and build the portal.
- `npm run start`: run the compiled application.
- `npm run db:export`: export database structure to `docs/database.sql`.
- `npm run format`: format source files.

The setup command is an explicit development schema-initialization operation; API startup never auto-synchronizes the database. Review schema changes and use a controlled database migration process for deployed environments.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API contract](docs/openapi.yaml)
- [API testing](docs/API-TESTING.md)
- [Database design](docs/DATABASE.md)
- [Final project documentation](docs/Final-Project-Documentation.pdf)
- [SQL schema export](docs/database.sql)
- [Verification results](docs/VERIFICATION.json)

The project implements a backend prototype for academic evaluation. It does not include billing, admissions, laboratory processing or production healthcare compliance. The video recording and presentation remain separate submission deliverables.
