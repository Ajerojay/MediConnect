# Security

Report vulnerabilities privately to the repository owner with reproducible steps. Do not include passwords, access tokens or patient information.

Passwords are hashed with bcrypt. JWTs expire after one hour and protected requests check current account status. Browser tokens use HTTP-only same-site cookies. DTOs validate input and TypeORM parameterizes SQL. Administrators cannot disable their own account through the API.

Only `.env.example` is committed. Populated environment files, local database storage, generated builds and migration snapshots are ignored. Database exports contain schema only. Seed credentials must be configured locally.

This is an academic prototype. Production use requires HTTPS, deployment-specific rate limiting, audited access controls, backups, controlled schema migrations, monitoring and an applicable healthcare privacy review.
