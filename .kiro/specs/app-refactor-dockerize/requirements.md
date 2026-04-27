# Requirements Document

## Introduction

This document defines the requirements for refactoring, securing, reorganizing, and Dockerizing an existing Node.js/Express internship management platform (Gestion des Stages). The platform manages internship listings, student applications, company profiles, academic supervision, and defense scheduling for Tunisian higher education institutions. The refactor addresses accumulated technical debt, security vulnerabilities, broken functionality, and the absence of a containerized deployment strategy.

---

## Glossary

- **Application**: The Node.js/Express internship management web application.
- **Server**: The Express HTTP server entry point (`server.js`).
- **DB_Module**: The Sequelize-based database abstraction layer (`model/model.js`).
- **Stage_Model**: The Sequelize model representing internship listings (`model/stagesModel.js`).
- **Postulation_Model**: The Sequelize model representing student internship applications (`model/stagePostulationModel.js`).
- **Soutenance_Model**: The Sequelize model representing defense scheduling (`model/soutenanceModel.js`).
- **User_Model**: The Sequelize model representing registered users (`controllers/UserRegistration.js`).
- **Auth_Middleware**: The JWT-based authentication middleware (`middlewares/auth.js`).
- **Role_Middleware**: The role-based access control middleware (`middlewares/roles.js`).
- **Search_Route**: The `/search` GET endpoint that queries internship listings.
- **Sidebar_Route**: The `/sidebar` POST endpoint that returns navigation items.
- **Docker_Compose**: The `docker-compose.yml` file that defines the multi-container environment.
- **Dockerfile**: The container build definition for the Application.
- **ENV_Example**: The `.env.example` file containing placeholder environment variable keys without real values.
- **Logger**: The Winston-based logging module (`logs/logger.js`).
- **Seed_Script**: A standalone script that populates the database with initial sidebar items from `items.sql`.
- **Fake_Data_Script**: A standalone script that generates and inserts fake internship and defense records for development use.
- **Config_Module**: A dedicated module that initializes and exports the Sequelize instance and database connection logic.
- **Role**: One of `USER`, `ENTREPRISE`, `DEPARTEMENT`, or `ADMIN`.

---

## Requirements

### Requirement 1: Remove Side-Effect Code from Module Imports

**User Story:** As a developer, I want modules to be free of startup side effects, so that importing a module does not trigger database connections, schema migrations, or data insertion.

#### Acceptance Criteria

1. THE DB_Module SHALL NOT call `sequelize.sync()`, `connectToDatabase()`, or `main()` at module load time.
2. THE Stage_Model SHALL NOT call `stage.sync({ alter: true })` or `insertFakeData()` at module load time.
3. THE Soutenance_Model SHALL NOT call `generateFakeSoutenances()` at module load time.
4. THE Postulation_Model SHALL NOT call `stagepostulation.sync()` or `candidature.sync()` at module load time.
5. THE User_Model SHALL NOT call `sequelize.sync()` or `syncModel()` at module load time.
6. WHEN the Server starts, THE Server SHALL call `connectToDatabase()` and `syncModel()` explicitly in the startup sequence, not via module side effects.

---

### Requirement 2: Fix Package Dependencies

**User Story:** As a developer, I want `package.json` to declare accurate, installable, and correctly categorized dependencies, so that `npm install` produces a working and secure dependency tree.

#### Acceptance Criteria

1. THE Application SHALL use `sequelize` version `^6.37.0` and `mysql2` version `^3.9.2` as runtime dependencies.
2. THE Application SHALL use `uuid` version `^9.0.0` as a runtime dependency.
3. THE `package.json` SHALL NOT list `crypto`, `fs`, or `path` as dependencies, as these are Node.js built-in modules.
4. THE `package.json` SHALL NOT list both `faker` and `@faker-js/faker`; only `@faker-js/faker` SHALL be retained as a devDependency.
5. THE `package.json` SHALL NOT list `install` as a dependency.
6. THE `package.json` SHALL list `nodemon` exclusively as a devDependency.
7. THE `package.json` SHALL include a `"start"` script that runs `node server.js` and a `"dev"` script that runs `nodemon server.js`.

---

### Requirement 3: Fix SQL Injection in Search Route

**User Story:** As a security engineer, I want the search endpoint to use parameterized queries, so that user-supplied input cannot manipulate the SQL executed against the database.

#### Acceptance Criteria

1. THE Search_Route SHALL use Sequelize `Op.like` with bound `replacements` or parameterized `where` clauses for all user-supplied search terms.
2. THE Search_Route SHALL NOT interpolate user-supplied strings directly into `Sequelize.literal()` expressions.
3. WHEN a search query contains special SQL characters (e.g., `%`, `_`, `'`, `--`), THE Search_Route SHALL treat them as literal search characters, not SQL syntax.
4. WHEN the search query parameter `q` is absent or empty, THE Search_Route SHALL redirect the client to `/home`.

---

### Requirement 4: Fix CORS Configuration

**User Story:** As a security engineer, I want the CORS policy to be valid and restrictive, so that cross-origin requests are handled correctly and credentials are not exposed to arbitrary origins.

#### Acceptance Criteria

1. THE Server SHALL NOT configure CORS with `origin: '*'` and `credentials: true` simultaneously, as this combination is rejected by browsers.
2. WHEN `FRONTEND_URL` is defined in the environment, THE Server SHALL configure CORS to allow only that origin.
3. IF `FRONTEND_URL` is not defined, THEN THE Server SHALL default the allowed CORS origin to `http://localhost:3000`.
4. THE Server SHALL allow credentials in CORS responses only when a specific origin is configured.

---

### Requirement 5: Remove Insecure Static File Serving

**User Story:** As a security engineer, I want the static file server to serve only the `public/` directory, so that application source code, `.env` files, and private keys are not accessible over HTTP.

#### Acceptance Criteria

1. THE Server SHALL serve static files exclusively from the `public/` directory using `express.static(path.join(__dirname, 'public'))`.
2. THE Server SHALL NOT use `express.static(path.join(__dirname, ''))`, which exposes the entire project root.
3. THE Server SHALL serve uploaded files from the `stockages/` directory under the `/stockages` path prefix.

---

### Requirement 6: Remove Duplicate and Dead Code

**User Story:** As a developer, I want the codebase to be free of unused imports, duplicate function definitions, and commented-out dead code blocks, so that the code is readable and maintainable.

#### Acceptance Criteria

1. THE Server SHALL NOT import `body-parser`, `ejs`, `literal`, `fn`, or `col` if those values are not used.
2. THE Server SHALL NOT define a local `authenticateToken` function that duplicates the logic of `Auth_Middleware`; the `/check-token` route SHALL use `Auth_Middleware` directly.
3. THE DB_Module SHALL NOT import both `fs/promises` and `fs`; only the required variant SHALL be imported.
4. THE `model/mysql.js` file SHALL NOT contain commented-out legacy connection code.
5. THE Server SHALL NOT contain commented-out route handler blocks.

---

### Requirement 7: Remove Production Console Logging of Sensitive Data

**User Story:** As a security engineer, I want middleware to not log user role information to the console in production, so that sensitive authorization data is not leaked in production logs.

#### Acceptance Criteria

1. THE Role_Middleware SHALL NOT call `console.log` to output user role, allowed roles, or request path in any environment.
2. WHEN access is denied, THE Role_Middleware SHALL log the denial event using the Logger at `warn` level without including the user's role value.
3. WHEN access is granted, THE Role_Middleware SHALL proceed without producing any log output.

---

### Requirement 8: Fix zlib Compression in Models

**User Story:** As a developer, I want text fields that use zlib compression to handle decompression errors gracefully and not break search queries, so that the application remains functional when compressed data is queried or corrupted.

#### Acceptance Criteria

1. WHEN a compressed field value cannot be decompressed, THE Stage_Model SHALL return an empty string rather than an error message string.
2. WHEN a compressed field value cannot be decompressed, THE Postulation_Model SHALL return an empty string rather than an error message string.
3. THE Search_Route SHALL NOT use `LIKE` queries against database columns that store zlib-compressed data, as compressed binary data cannot be matched with text patterns.
4. WHEN searching internship listings, THE Search_Route SHALL query only plaintext columns (e.g., `Titre`, `Domaine`, `Niveau`, `Langue`, `Address`, `State`, `Nom`).

---

### Requirement 9: Isolate Fake Data Generation

**User Story:** As a developer, I want fake data generation to be a standalone, opt-in script, so that random records are never inserted into the database during normal server startup.

#### Acceptance Criteria

1. THE Fake_Data_Script SHALL be a standalone Node.js script (e.g., `scripts/seedFakeData.js`) that can be run manually via `node scripts/seedFakeData.js`.
2. THE Stage_Model SHALL NOT call `insertFakeData()` at any point during module load or server startup.
3. THE Soutenance_Model SHALL NOT call `generateFakeSoutenances()` at any point during module load or server startup.
4. THE Seed_Script SHALL be a standalone Node.js script (e.g., `scripts/seedSidebar.js`) that executes `items.sql` and can be run independently.
5. THE `package.json` SHALL include a `"seed"` script entry that runs `node scripts/seedSidebar.js`.

---

### Requirement 10: Add Security Headers

**User Story:** As a security engineer, I want the Application to send standard HTTP security headers on every response, so that common browser-based attacks are mitigated.

#### Acceptance Criteria

1. THE Server SHALL use the `helmet` middleware to set security-related HTTP response headers.
2. THE Server SHALL apply `helmet` before any route handlers are registered.
3. THE `package.json` SHALL list `helmet` as a runtime dependency.

---

### Requirement 11: Add Rate Limiting on Authentication and Search Routes

**User Story:** As a security engineer, I want authentication and search endpoints to be rate-limited, so that brute-force and denial-of-service attacks are mitigated.

#### Acceptance Criteria

1. THE Server SHALL apply a rate limiter to all routes under `/connection` that limits each IP address to no more than 20 requests per 15-minute window.
2. THE Server SHALL apply a rate limiter to the `/search` route that limits each IP address to no more than 30 requests per minute.
3. WHEN a client exceeds the rate limit, THE Server SHALL respond with HTTP status 429 and a plain-text message indicating the limit has been exceeded.
4. THE `package.json` SHALL list `express-rate-limit` as a runtime dependency.

---

### Requirement 12: Centralize Database Configuration

**User Story:** As a developer, I want all database connection logic to live in a single Config_Module, so that the Sequelize instance is not duplicated across files and connection parameters are managed in one place.

#### Acceptance Criteria

1. THE Config_Module SHALL be the sole location where the Sequelize instance is created and configured.
2. THE DB_Module, Stage_Model, Postulation_Model, Soutenance_Model, and User_Model SHALL all import the Sequelize instance from the Config_Module.
3. THE Config_Module SHALL read all database connection parameters exclusively from environment variables.
4. THE Config_Module SHALL NOT call `sequelize.authenticate()` or `sequelize.sync()` at module load time.

---

### Requirement 13: Create `.env.example`

**User Story:** As a developer, I want a `.env.example` file with placeholder values, so that new contributors know which environment variables are required without exposing real credentials.

#### Acceptance Criteria

1. THE Application SHALL include a `.env.example` file at the project root containing all required environment variable keys with placeholder values (e.g., `DATABASE_PASSWORD=your_db_password_here`).
2. THE `.env.example` SHALL include keys for: `DATABASE_DIALECT`, `DATABASE_HOST`, `DATABASE_NAME`, `DATABASE_PASSWORD`, `DATABASE_PORT`, `DATABASE_USER`, `FRONTEND_URL`, `JWT_SECRET`, `secretKey`, `NODEMAILER_USER`, `NODEMAILER_PASS`, `GOOGLE_CREDENTIALS`, `GOOGLE_DRIVE_STORAGES`, and `PORT`.
3. THE `.env` file SHALL be listed in `.gitignore` to prevent real credentials from being committed.
4. THE `.env.example` file SHALL NOT contain any real credentials, tokens, private keys, or passwords.

---

### Requirement 14: Add Dockerfile

**User Story:** As a DevOps engineer, I want a Dockerfile for the Application, so that it can be built into a reproducible container image.

#### Acceptance Criteria

1. THE Dockerfile SHALL use an official Node.js LTS base image (e.g., `node:20-alpine`).
2. THE Dockerfile SHALL copy `package.json` and `package-lock.json` before copying application source code, to leverage Docker layer caching for `npm install`.
3. THE Dockerfile SHALL run `npm ci --omit=dev` to install only production dependencies.
4. THE Dockerfile SHALL set the working directory to `/app`.
5. THE Dockerfile SHALL expose port `3000`.
6. THE Dockerfile SHALL define a `CMD` that starts the Application using `node server.js`.
7. THE Dockerfile SHALL include a `.dockerignore` file that excludes `node_modules`, `.env`, `logs/logs/`, and `.git`.

---

### Requirement 15: Add Docker Compose Configuration

**User Story:** As a DevOps engineer, I want a `docker-compose.yml` that defines the Application and a MySQL service, so that the full stack can be started with a single command.

#### Acceptance Criteria

1. THE Docker_Compose SHALL define an `app` service built from the project Dockerfile.
2. THE Docker_Compose SHALL define a `db` service using the official `mysql:8.0` image.
3. THE `db` service SHALL use a named Docker volume to persist MySQL data across container restarts.
4. THE `app` service SHALL declare a dependency on the `db` service using `depends_on`.
5. THE Docker_Compose SHALL pass all required environment variables to the `app` service via an `env_file` directive referencing `.env`.
6. THE `db` service SHALL configure `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, and `MYSQL_PASSWORD` from environment variables.
7. THE Docker_Compose SHALL map host port `3000` to container port `3000` for the `app` service.
8. THE Docker_Compose SHALL map host port `3306` to container port `3306` for the `db` service.

---

### Requirement 16: Proper Error Handling and Graceful Shutdown

**User Story:** As a developer, I want the Application to handle unhandled errors and shut down gracefully, so that crashes are logged and the process exits cleanly.

#### Acceptance Criteria

1. THE Server SHALL register a handler for `process.on('uncaughtException')` that logs the error using the Logger and exits with code `1`.
2. THE Server SHALL register a handler for `process.on('unhandledRejection')` that logs the rejection reason using the Logger.
3. WHEN the Server receives a `SIGTERM` or `SIGINT` signal, THE Server SHALL close the HTTP server and the database connection before exiting.
4. WHEN a route handler throws an unhandled error, THE Server SHALL pass it to the Express error-handling middleware, which SHALL log the error and respond with HTTP status 500.
5. THE Server SHALL define a catch-all Express error handler as the last middleware registered.
