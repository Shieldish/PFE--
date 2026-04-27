# Implementation Plan: app-refactor-dockerize

## Overview

Surgical refactor of the Gestion des Stages Node.js/Express application. Tasks are ordered so each step produces a runnable state: dependency fixes first, then the new `config/database.js` module that everything else depends on, then model cleanups, then server-level fixes, then new files (scripts, Docker artifacts). Property-based tests are placed immediately after the code they validate.

## Tasks

- [x] 1. Fix `package.json` dependencies and scripts
  - Change `sequelize` from `^3.30.0` to `^6.37.0`
  - Change `uuid` from `^14.0.0` to `^9.0.0`
  - Remove `crypto`, `fs`, `path`, `faker`, and `install` from dependencies
  - Move `@faker-js/faker` to `devDependencies` only (remove from dependencies if present)
  - Ensure `nodemon` is in `devDependencies` only
  - Add `helmet` as a runtime dependency
  - Confirm `express-rate-limit` is listed as a runtime dependency
  - Add `jest` `^29.0.0` and `fast-check` `^3.0.0` to `devDependencies`
  - Set `"start"` script to `"node server.js"`, `"dev"` to `"nodemon server.js"`, add `"seed": "node scripts/seedSidebar.js"`, add `"test": "jest --runInBand"`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 9.5, 10.3, 11.4_

- [x] 2. Create `config/database.js` (Config_Module)
  - Create `config/` directory and `config/database.js`
  - Instantiate `Sequelize` using only `process.env` variables: `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_HOST`, `DATABASE_DIALECT`, `DATABASE_PORT`
  - Default `dialect` to `'mysql'` and `port` to `3306` when env vars are absent
  - Set `logging: false`
  - Export `{ sequelize, Sequelize }` — no `authenticate()` or `sync()` calls at module load time
  - _Requirements: 12.1, 12.3, 12.4_

  - [ ]* 2.1 Write property test for Config_Module env var mapping
    - **Property 5: Config_Module Sequelize instance reflects environment variables**
    - For any valid combination of `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_HOST`, `DATABASE_DIALECT`, `DATABASE_PORT`, the created Sequelize instance `config` properties SHALL match those values exactly
    - Use `fc.record(...)` arbitraries; clear module cache between iterations with `jest.resetModules()`
    - Create test file `tests/config.database.property.test.js`
    - **Validates: Requirements 12.3**

- [x] 3. Refactor `model/model.js`
  - Replace the local `new Sequelize(...)` instantiation with an import of `sequelize` from `../config/database`
  - Remove the duplicate `fs` import — keep only `fs/promises` (used by `main()`), or remove it entirely since `main()` is being moved
  - Remove the `sequelize.sync().then(() => { main(); })` call at module load time
  - Remove the `connectToDatabase()` call at module load time
  - Remove the `syncModel()` call at module load time
  - Keep `enseignant`, `encadrant`, `etudiant`, `entreprise` model definitions, `getAllTablesAndStructure`, `getDataFromTable`, `connectToDatabase`, `syncModel`, and `executeSQLCommands` exports
  - Export `{ enseignant, encadrant, etudiant, entreprise, getAllTablesAndStructure, getDataFromTable, sequelize, DataTypes }`
  - _Requirements: 1.1, 6.3, 12.2_

- [x] 4. Create `model/userModel.js` and update `controllers/UserRegistration.js`
  - Create `model/userModel.js` with the `user_registration` Sequelize model definition (move from `controllers/UserRegistration.js`)
  - Import `sequelize` and `DataTypes` from `../config/database`
  - Keep the `beforeCreate` bcrypt hook and `validPassword` prototype method
  - Export `async function syncUserModel()` that calls `user_registration.sync({ alter: true })` — do NOT call it at module load time
  - Export `{ user_registration, syncUserModel }`
  - Update `controllers/UserRegistration.js` to re-export from `model/userModel.js` for backward compatibility: `module.exports = require('../model/userModel').user_registration`
  - Remove the `sequelize.sync()` call and the `syncModel()` call from `controllers/UserRegistration.js`
  - _Requirements: 1.5, 12.2_

- [x] 5. Refactor `model/stagesModel.js`
  - Replace `require('./model')` Sequelize import with `require('../config/database')`
  - Remove the IIFE `(async () => { await stage.sync({ alter: true }); })()` at module load time
  - Remove the `insertFakeData()` call and the `fakeDatas` array and `insertFakeData` function from this file (they move to `scripts/seedFakeData.js`)
  - Fix the `Description` getter: return `''` instead of the error message string on decompression failure
  - Export a `syncStageModel()` function: `async function syncStageModel() { await stage.sync({ alter: true }); }`
  - Export `{ stage, syncStageModel }` (keep default export `stage` for backward compatibility if needed)
  - _Requirements: 1.2, 8.1, 9.2, 12.2_

  - [ ]* 5.1 Write property test for `Description` getter error handling
    - **Property 4: Compressed field getters return empty string on decompression failure**
    - For any string that is not valid deflate-compressed base64 data, the `Description` getter SHALL return `''`
    - Use `fc.string()` and `fc.uint8Array()` arbitraries; set raw data value on a model instance and call the getter directly
    - Create test file `tests/stagesModel.property.test.js`
    - **Validates: Requirements 8.1**

- [x] 6. Refactor `model/soutenanceModel.js`
  - Replace `require('./model')` Sequelize import with `require('../config/database')`
  - Remove the `generateFakeSoutenances()` call at module load time (function moves to `scripts/seedFakeData.js`)
  - Keep the `Soutenance` model definition
  - Export `async function syncSoutenanceModel()` that calls `Soutenance.sync({ alter: true })`
  - Export `{ Soutenance, syncSoutenanceModel }`
  - _Requirements: 1.3, 9.3, 12.2_

- [x] 7. Refactor `model/stagePostulationModel.js`
  - Replace `require('./model')` Sequelize import with `require('../config/database')`
  - Remove the IIFE that calls `stagepostulation.sync()`, `candidature.sync()`, and `Soutenance.sync()` at module load time
  - Fix the `experience_description` getter: return `''` instead of the error message string on decompression failure
  - Fix the `motivation` getter: return `''` instead of the error message string on decompression failure
  - Export `async function syncPostulationModels()` that syncs both models
  - Export `{ candidature, stagepostulation, syncPostulationModels }`
  - _Requirements: 1.4, 8.2, 12.2_

  - [ ]* 7.1 Write property test for `experience_description` and `motivation` getter error handling
    - **Property 4: Compressed field getters return empty string on decompression failure**
    - For any string that is not valid deflate-compressed base64 data, both `experience_description` and `motivation` getters SHALL return `''`
    - Use `fc.string()` and `fc.uint8Array()` arbitraries; test getters directly on model instances
    - Create test file `tests/stagePostulationModel.property.test.js`
    - **Validates: Requirements 8.2**

- [x] 8. Refactor `model/dbConfig.js`
  - Replace the `require('./model')` import of `sequelize` with `require('../config/database')`
  - Remove the `main()` call at module load time (sidebar seeding moves to `scripts/seedSidebar.js`)
  - Keep `connectToDatabase()` and `fetchSidebarItems()` functions
  - Export `{ sequelize, connectToDatabase, fetchSidebarItems }`
  - _Requirements: 1.1, 12.2_

- [x] 9. Refactor `middlewares/roles.js`
  - Remove all `console.log` calls
  - Import the Logger: `const logger = require('../logs/logger')`
  - On access denial, call `logger.warn(\`Access denied: \${req.method} \${req.path}\`)` — the message MUST NOT include the user's role value
  - On access grant, call `next()` with no log output
  - On missing role, redirect to login with no log output
  - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 9.1 Write property test for role middleware logging behavior
    - **Property 3: Role middleware never calls console.log, and only warns on denial**
    - For any role value and any list of allowed roles, `console.log` SHALL never be called; `logger.warn` SHALL be called iff the role is not in the allowed list; the warn message SHALL NOT contain the role value
    - Use `fc.string()` for role, `fc.array(fc.string())` for allowed roles; spy on `console.log` and `logger.warn`
    - Mock `req`, `res`, `next` appropriately
    - Create test file `tests/roles.property.test.js`
    - **Validates: Requirements 7.1, 7.2, 7.3**

- [x] 10. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Refactor `server.js` — security and correctness fixes
  - [x] 11.1 Fix static file serving
    - Replace `express.static(path.join(__dirname, ''))` with `express.static(path.join(__dirname, 'public'))`
    - Keep the `/stockages` static route unchanged
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 11.2 Fix CORS configuration
    - Replace `origin: '*'` with `origin: process.env.FRONTEND_URL || 'http://localhost:3000'`
    - Keep `credentials: true` (now safe because a specific origin is set)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 11.3 Write property test for CORS origin configuration
    - **Property 2: CORS origin reflects the FRONTEND_URL environment variable**
    - For any valid URL string assigned to `process.env.FRONTEND_URL`, the CORS config builder SHALL produce `origin` equal to that URL with `credentials: true`
    - Extract the CORS config builder into a testable function; use `fc.webUrl()` arbitraries
    - Create test file `tests/cors.property.test.js`
    - **Validates: Requirements 4.2, 4.4**

  - [x] 11.4 Add `helmet` middleware
    - `npm install helmet` (already added to package.json in task 1)
    - Add `const helmet = require('helmet')` import
    - Apply `app.use(helmet())` before any route handlers
    - _Requirements: 10.1, 10.2_

  - [x] 11.5 Add rate limiters
    - Add `connectionLimiter`: `windowMs: 15 * 60 * 1000`, `max: 20`, `message: 'Too many requests from this IP, please try again later.'`
    - Add `searchLimiter`: `windowMs: 60 * 1000`, `max: 30`, `message: 'Too many search requests from this IP, please try again later.'`
    - Apply `app.use('/connection', connectionLimiter)` before route registration
    - Apply `searchLimiter` as middleware on the `/search` GET route
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 11.6 Fix the search route — remove SQL injection and compressed columns
    - Replace the current `Sequelize.literal()` interpolation with `Op.like` bound parameters only
    - Remove `Description`, `Libelle`, and `Experience` from the search `where` clause (Description is zlib-compressed; Libelle and Experience are low-value)
    - Search only: `Titre`, `Domaine`, `Niveau`, `Langue`, `Address`, `State`, `Nom`
    - When `q` is absent or empty (after trim), redirect to `/home`
    - Apply `searchLimiter` middleware on this route
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 8.3, 8.4_

  - [ ]* 11.7 Write property test for search query parameterization
    - **Property 1: Search query terms are always parameterized**
    - For any non-empty string (including SQL metacharacters `%`, `_`, `'`, `--`, `;`, `UNION`), the search where-clause builder SHALL produce only `Op.like` conditions with the term as a bound value; no `Sequelize.literal()` call SHALL be made
    - Extract the where-clause builder into a testable pure function; mock `stage.findAndCountAll` to capture the `where` argument; use `fc.string()` arbitraries
    - Create test file `tests/search.property.test.js`
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [x] 11.8 Remove duplicate `authenticateToken` and dead code
    - Replace the local `authenticateToken` function and its use on `/check-token` with the imported `authenticate` middleware
    - Remove unused imports: `body-parser`, `ejs`, `literal`, `fn`, `col`
    - Remove commented-out route handler blocks
    - _Requirements: 6.1, 6.2, 6.5_

  - [x] 11.9 Update startup sequence — explicit `syncAllModels()`
    - Import all sync functions: `syncStageModel`, `syncSoutenanceModel`, `syncPostulationModels`, `syncUserModel`, and `syncModel` (for enseignant/encadrant/etudiant/entreprise)
    - Define `async function syncAllModels()` that calls each sync function in order
    - Update `startServer()` to call `connectToDatabase()` then `syncAllModels()` then `app.listen()`
    - _Requirements: 1.6_

  - [x] 11.10 Add error handling middleware and process-level handlers
    - Register a catch-all Express error handler as the LAST middleware: `app.use((err, req, res, next) => { logger.error(err.stack || err.message); res.status(500).render('404', { error: 'Internal server error' }); })`
    - Add `process.on('uncaughtException', ...)` that logs via Logger and calls `process.exit(1)`
    - Add `process.on('unhandledRejection', ...)` that logs via Logger (remove the duplicate handler from `logs/logger.js`)
    - Add graceful shutdown: `SIGTERM` and `SIGINT` handlers that call `server.close()` then `sequelize.close()`
    - Store the return value of `app.listen()` in a `server` variable for use in shutdown
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

  - [ ]* 11.11 Write property test for Express error middleware
    - **Property 6: Express error middleware responds with HTTP 500 for any thrown error**
    - For any Error-like object, the catch-all middleware SHALL call `logger.error` and respond with HTTP status `500`
    - Use `fc.record({ message: fc.string(), stack: fc.option(fc.string()) })` arbitraries; mock `req`, `res`, `next`, and `logger`
    - Create test file `tests/errorMiddleware.property.test.js`
    - **Validates: Requirements 16.4**

- [x] 12. Remove dead code from `model/mysql.js`
  - Remove all commented-out legacy connection code from `model/mysql.js`
  - _Requirements: 6.4_

- [x] 13. Create `scripts/seedFakeData.js`
  - Create `scripts/` directory and `scripts/seedFakeData.js`
  - Import `config/database.js`, `model/stagesModel.js` (for `insertFakeData` logic), and `model/soutenanceModel.js` (for `generateFakeSoutenances` logic)
  - Move the `fakeDatas` array and `insertFakeData()` function from `model/stagesModel.js` into this script
  - Move the `generateFakeSoutenances()` function from `model/soutenanceModel.js` into this script
  - Call both functions then close the DB connection: `sequelize.close()`
  - Script must be runnable standalone: `node scripts/seedFakeData.js`
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 14. Create `scripts/seedSidebar.js`
  - Create `scripts/seedSidebar.js`
  - Import `config/database.js`
  - Read `items.sql`, split on `;`, execute each non-empty statement via `sequelize.query()`
  - Close the DB connection after execution
  - Script must be runnable standalone: `node scripts/seedSidebar.js`
  - _Requirements: 9.4, 9.5_

- [x] 15. Create `.env.example`
  - Create `.env.example` at the project root with all required keys and placeholder values (no real credentials)
  - Include: `DATABASE_DIALECT`, `DATABASE_HOST`, `DATABASE_NAME`, `DATABASE_PASSWORD`, `DATABASE_PORT`, `DATABASE_USER`, `FRONTEND_URL`, `JWT_SECRET`, `secretKey`, `NODEMAILER_USER`, `NODEMAILER_PASS`, `GOOGLE_CREDENTIALS`, `GOOGLE_DRIVE_STORAGES`, `PORT`
  - Verify `.env` is listed in `.gitignore`
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [x] 16. Create `Dockerfile` and `.dockerignore`
  - Create `Dockerfile` using `node:20-alpine` base image
  - Set `WORKDIR /app`
  - Copy `package.json` and `package-lock.json` first, then run `npm ci --omit=dev`, then `COPY . .`
  - `EXPOSE 3000`
  - `CMD ["node", "server.js"]`
  - Create `.dockerignore` excluding: `node_modules`, `.env`, `logs/logs/`, `.git`
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

- [x] 17. Create `docker-compose.yml`
  - Define `db` service using `mysql:8.0` with `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` from env vars; named volume `mysql_data`; port `3306:3306`; healthcheck using `mysqladmin ping`
  - Define `app` service built from project Dockerfile; port `3000:3000`; `env_file: .env`; `depends_on: db: condition: service_healthy`
  - Declare `volumes: mysql_data:`
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8_

- [x] 18. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use **fast-check** and run with **Jest** (`npm test`)
- Checkpoints at tasks 10 and 18 ensure incremental validation
- The `config/database.js` module (task 2) is a prerequisite for all model refactors (tasks 3–8)
- `scripts/` tasks (13–14) depend on model refactors being complete so the fake-data functions can be moved cleanly
