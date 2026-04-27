# Design Document — app-refactor-dockerize

## Overview

This document describes the technical design for refactoring, securing, and Dockerizing the **Gestion des Stages** Node.js/Express application. The goal is to eliminate accumulated technical debt and security vulnerabilities while keeping structural changes minimal: existing routes, views, controllers, and the overall Express architecture remain in place. The changes are surgical — targeted fixes applied file-by-file, plus a small number of new files for configuration centralization, seed scripts, and Docker artifacts.

The refactor is organized around six themes:

1. **Correctness** — remove module-load side effects, fix broken zlib error handling
2. **Security** — fix SQL injection, CORS misconfiguration, static file exposure, add helmet and rate limiting
3. **Code quality** — remove dead/duplicate code, move models to canonical locations
4. **Configuration** — centralize DB config, add `.env.example`
5. **Developer experience** — isolate fake-data scripts, fix package.json
6. **Deployment** — add Dockerfile and docker-compose.yml

---

## Architecture

The application follows a classic MVC layout on top of Express. The architecture does not change; only the wiring between layers is cleaned up.

```
┌─────────────────────────────────────────────────────────────┐
│                        server.js                            │
│  (startup sequence, middleware stack, top-level routes)     │
└────────────┬────────────────────────────────────────────────┘
             │ imports
    ┌────────▼────────┐        ┌──────────────────────────┐
    │  config/        │        │  middlewares/            │
    │  database.js    │        │  auth.js  roles.js       │
    │  (Sequelize     │        └──────────────────────────┘
    │   instance)     │
    └────────┬────────┘
             │ imported by all models
    ┌────────▼──────────────────────────────────────────────┐
    │  model/                                               │
    │  model.js            (enseignant, encadrant,          │
    │                       etudiant, entreprise)           │
    │  stagesModel.js      (stage)                          │
    │  stagePostulationModel.js  (stagepostulation,         │
    │                             candidature)              │
    │  soutenanceModel.js  (Soutenance)                     │
    │  userModel.js        (user_registration) ← moved      │
    │  dbConfig.js         (fetchSidebarItems,              │
    │                       connectToDatabase)              │
    └───────────────────────────────────────────────────────┘
             │
    ┌────────▼──────────────────────────────────────────────┐
    │  routes/  controllers/  views/  emails/               │
    │  (unchanged structure)                                │
    └───────────────────────────────────────────────────────┘
             │
    ┌────────▼──────────────────────────────────────────────┐
    │  scripts/                                             │
    │  seedFakeData.js   (standalone, opt-in)               │
    │  seedSidebar.js    (standalone, opt-in)               │
    └───────────────────────────────────────────────────────┘
```

### Startup sequence (server.js)

```
require('dotenv').config()
  → apply helmet
  → apply CORS (origin from FRONTEND_URL env var)
  → apply rate limiters
  → register middleware stack
  → register routes
  → startServer():
      connectToDatabase()   ← explicit call, not a side effect
      syncAllModels()       ← explicit call, not a side effect
      app.listen(PORT)
  → register process signal handlers (SIGTERM, SIGINT)
  → register uncaughtException / unhandledRejection handlers
```

---

## Components and Interfaces

### 1. `config/database.js` (new file — Config_Module)

Sole location where the Sequelize instance is created. All models import from here.

```js
// config/database.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DATABASE_NAME,
  process.env.DATABASE_USER,
  process.env.DATABASE_PASSWORD,
  {
    host: process.env.DATABASE_HOST,
    dialect: process.env.DATABASE_DIALECT || 'mysql',
    port: parseInt(process.env.DATABASE_PORT, 10) || 3306,
    logging: false,
  }
);

module.exports = { sequelize, Sequelize };
```

**Constraints:**
- No `sequelize.authenticate()` or `sequelize.sync()` at module load time.
- All connection parameters come exclusively from `process.env`.

---

### 2. `model/model.js` (modified)

Removes the Sequelize instantiation (moved to `config/database.js`). Removes all module-load side effects (`sequelize.sync()`, `connectToDatabase()`, `main()`). Removes the duplicate `fs` import. Keeps entity model definitions and utility functions.

**Exports:** `{ enseignant, encadrant, etudiant, entreprise, getAllTablesAndStructure, getDataFromTable, sequelize, DataTypes }`

---

### 3. `model/userModel.js` (new file — User_Model)

The `user_registration` Sequelize model is moved out of `controllers/UserRegistration.js` into `model/userModel.js`. The `syncModel()` function is exported but **not called at module load time**.

```js
// model/userModel.js
const { sequelize, DataTypes } = require('../config/database');
const bcrypt = require('bcrypt');

const user_registration = sequelize.define('user_registration', { /* ... */ }, {
  timestamps: true,
  hooks: { beforeCreate: async (u) => { /* bcrypt hash */ } }
});
user_registration.prototype.validPassword = function(pw) { /* ... */ };

async function syncUserModel() {
  await user_registration.sync({ alter: true });
}

module.exports = { user_registration, syncUserModel };
```

`controllers/UserRegistration.js` is updated to re-export from `model/userModel.js` for backward compatibility with any existing imports.

---

### 4. `model/stagesModel.js` (modified)

- Removes the IIFE that calls `stage.sync({ alter: true })` at load time.
- Removes the `insertFakeData()` call and the `fakeDatas` array from this file entirely (moved to `scripts/seedFakeData.js`).
- Keeps the `stage` model definition and the `beforeCreate` UUID hook.
- Fixes the `Description` getter: returns `''` instead of an error message string on decompression failure.
- Exports a `syncStageModel()` function for use in the server startup sequence.

---

### 5. `model/soutenanceModel.js` (modified)

- Removes the `generateFakeSoutenances()` call at module load time.
- Keeps the `Soutenance` model definition.
- Exports a `syncSoutenanceModel()` function.
- The `generateFakeSoutenances()` function is moved to `scripts/seedFakeData.js`.

---

### 6. `model/stagePostulationModel.js` (modified)

- Removes the IIFE that calls `stagepostulation.sync()`, `candidature.sync()`, and `Soutenance.sync()` at load time.
- Fixes the `experience_description` and `motivation` getters: return `''` on decompression failure.
- Exports `{ candidature, stagepostulation, syncPostulationModels }`.

---

### 7. `model/dbConfig.js` (modified)

- Removes the `main()` call at module load time (sidebar seeding moved to `scripts/seedSidebar.js`).
- Imports `sequelize` from `config/database.js` instead of re-exporting it from `model/model.js`.
- Keeps `connectToDatabase()` and `fetchSidebarItems()`.

---

### 8. `middlewares/roles.js` (modified)

All `console.log` calls are removed. On access denial, `logger.warn` is called with a message that does **not** include the user's role value. On access grant, no logging occurs.

```js
const logger = require('../logs/logger');
const checkRole = (roles) => (req, res, next) => {
  const userRole = req.role;
  if (!userRole) {
    req.flash('error', 'Vous devez être connecté pour accéder à cette page');
    return res.redirect('/connection/login');
  }
  if (roles.includes(userRole)) {
    return next();
  }
  logger.warn(`Access denied: ${req.method} ${req.path}`);
  req.flash('error', 'Erreur (403) : Accès refusé');
  return res.render('AccessDenied', { messages: req.flash() });
};
module.exports = checkRole;
```

---

### 9. `server.js` (modified)

Key changes:

| Area | Before | After |
|---|---|---|
| Static files | `express.static(__dirname, '')` (project root) | `express.static(path.join(__dirname, 'public'))` |
| CORS | `origin: '*', credentials: true` | `origin: process.env.FRONTEND_URL \|\| 'http://localhost:3000'` |
| Security headers | none | `app.use(helmet())` before routes |
| Rate limiting | none | `connectionLimiter` on `/connection`, `searchLimiter` on `/search` |
| `/check-token` | local `authenticateToken` duplicate | uses imported `authenticate` middleware |
| Search route | `Sequelize.literal()` with interpolated user input | `Op.like` with bound parameters only; no compressed columns |
| Unused imports | `bodyParser`, `ejs`, `literal`, `fn`, `col` | removed |
| Error handler | none | catch-all `(err, req, res, next)` middleware as last registration |
| Graceful shutdown | none | `SIGTERM`/`SIGINT` handlers close server + DB |
| Process error handlers | none | `uncaughtException` logs + exits; `unhandledRejection` logs |
| Startup | `connectToDatabase()` only | `connectToDatabase()` + `syncAllModels()` |

**Rate limiter configuration:**

```js
const rateLimit = require('express-rate-limit');

const connectionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many search requests from this IP, please try again later.',
});

app.use('/connection', connectionLimiter);
// ...
app.get('/search', searchLimiter, async (req, res) => { ... });
```

**Fixed search route (no SQL injection, no compressed columns):**

```js
app.get('/search', searchLimiter, async (req, res) => {
  const query = req.query.q;
  if (!query || !query.trim()) return res.redirect('/home');

  const page = parseInt(req.query.page, 10) || 1;
  const terms = query.split(' ').map(t => t.trim()).filter(Boolean);

  const { count, rows: jobs } = await stage.findAndCountAll({
    where: {
      [Op.or]: terms.flatMap(term => [
        { Titre:   { [Op.like]: `%${term}%` } },
        { Domaine: { [Op.like]: `%${term}%` } },
        { Niveau:  { [Op.like]: `%${term}%` } },
        { Langue:  { [Op.like]: `%${term}%` } },
        { Address: { [Op.like]: `%${term}%` } },
        { State:   { [Op.like]: `%${term}%` } },
        { Nom:     { [Op.like]: `%${term}%` } },
      ])
    },
    limit: ITEMS_PER_PAGE,
    offset: (page - 1) * ITEMS_PER_PAGE,
  });
  // ...
});
```

Note: `Description`, `Libelle`, and `Experience` are removed from the search where clause. `Description` is zlib-compressed (cannot be text-searched). `Libelle` and `Experience` are plaintext but low-value for search; they can be re-added if needed without security risk since they use `Op.like`.

---

### 10. `scripts/seedFakeData.js` (new file)

Standalone script. Imports `config/database.js`, `model/stagesModel.js`, and `model/soutenanceModel.js`. Calls `insertFakeData()` and `generateFakeSoutenances()` then closes the connection. Must be run manually: `node scripts/seedFakeData.js`.

---

### 11. `scripts/seedSidebar.js` (new file)

Standalone script. Reads `items.sql`, splits on `;`, executes each statement via `sequelize.query()`, then closes the connection. Must be run manually: `node scripts/seedSidebar.js` (or via `npm run seed`).

---

### 12. `Dockerfile` (new file)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

---

### 13. `docker-compose.yml` (new file)

```yaml
services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DATABASE_PASSWORD}
      MYSQL_DATABASE: ${DATABASE_NAME}
      MYSQL_USER: ${DATABASE_USER}
      MYSQL_PASSWORD: ${DATABASE_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      db:
        condition: service_healthy

volumes:
  mysql_data:
```

---

### 14. `.dockerignore` (new file)

```
node_modules
.env
logs/logs/
.git
```

---

### 15. `.env.example` (new file)

```
DATABASE_DIALECT=mysql
DATABASE_HOST=localhost
DATABASE_NAME=your_db_name_here
DATABASE_PASSWORD=your_db_password_here
DATABASE_PORT=3306
DATABASE_USER=your_db_user_here
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret_here
secretKey=your_session_secret_here
NODEMAILER_USER=your_email_here
NODEMAILER_PASS=your_email_password_here
GOOGLE_CREDENTIALS=your_google_credentials_json_here
GOOGLE_DRIVE_STORAGES=your_google_drive_folder_id_here
PORT=3000
```

---

### 16. `package.json` (modified)

| Change | Detail |
|---|---|
| `sequelize` | `^3.30.0` → `^6.37.0` |
| `uuid` | `^14.0.0` → `^9.0.0` |
| Remove | `crypto`, `fs`, `path`, `faker`, `install` |
| Move | `@faker-js/faker` stays in `devDependencies` |
| Move | `nodemon` stays in `devDependencies` only |
| Add | `helmet` as runtime dependency |
| Scripts | `"start": "node server.js"`, `"dev": "nodemon server.js"`, `"seed": "node scripts/seedSidebar.js"` |

---

## Data Models

No schema changes. All Sequelize model definitions remain identical. The only changes are:

- **Error handling in getters**: `Description` (stage), `experience_description` and `motivation` (candidature) return `''` instead of an error message string on decompression failure.
- **UUID generation**: `stage.beforeCreate` and `etudiant.beforeCreate` hooks remain unchanged.
- **Sync strategy**: All `model.sync({ alter: true })` calls are consolidated into a single `syncAllModels()` function called once during server startup.

```js
// server.js — startup sequence
async function syncAllModels() {
  await enseignant.sync({ alter: true });
  await encadrant.sync({ alter: true });
  await etudiant.sync({ alter: true });
  await entreprise.sync({ alter: true });
  await stage.sync({ alter: true });
  await user_registration.sync({ alter: true });
  await stagepostulation.sync({ alter: true });
  await candidature.sync({ alter: true });
  await Soutenance.sync({ alter: true });
}
```

### Entity summary

| Model | Table | PK | Compressed fields |
|---|---|---|---|
| `enseignant` | enseignant | EMAIL (STRING) | — |
| `encadrant` | encadrant | EMAIL (STRING) | — |
| `etudiant` | etudiant | EMAIL (STRING) | — |
| `entreprise` | entreprise | EMAIL (STRING) | — |
| `stage` | stage | id (UUID STRING) | Description |
| `stagepostulation` | stagepostulation | id (INT autoincrement) | — |
| `candidature` | candidature | candidatureId (UUID) | experience_description, motivation |
| `Soutenance` | soutenance | id (INT autoincrement) | — |
| `user_registration` | user_registration | (default Sequelize id) | — |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

This feature involves business logic (query construction, middleware authorization, compression error handling, configuration mapping) that is well-suited to property-based testing. The properties below are derived from the prework analysis of the acceptance criteria.

---

### Property 1: Search query terms are always parameterized

*For any* non-empty search query string (including strings containing SQL metacharacters such as `%`, `_`, `'`, `--`, `;`, and `UNION`), the search route's where clause construction SHALL produce only `Op.like` conditions where the user-supplied term appears as a bound value, never interpolated into a `Sequelize.literal()` expression.

**Validates: Requirements 3.1, 3.2, 3.3**

---

### Property 2: CORS origin reflects the FRONTEND_URL environment variable

*For any* valid URL string assigned to `process.env.FRONTEND_URL`, the CORS middleware SHALL be configured with that exact string as the allowed origin, and `credentials: true` SHALL be set.

**Validates: Requirements 4.2, 4.4**

---

### Property 3: Role middleware never calls console.log, and only warns on denial

*For any* role value and *for any* list of allowed roles, the `checkRole` middleware SHALL never invoke `console.log`. When the role is not in the allowed list, it SHALL call `logger.warn` with a message that does not contain the role value. When the role is in the allowed list, it SHALL call `next()` without producing any log output.

**Validates: Requirements 7.1, 7.2, 7.3**

---

### Property 4: Compressed field getters return empty string on decompression failure

*For any* string stored in a compressed field (`Description` on `stage`, `experience_description` or `motivation` on `candidature`) that is not valid deflate-compressed base64 data, the Sequelize getter SHALL return an empty string `''` rather than an error message string or throwing an exception.

**Validates: Requirements 8.1, 8.2**

---

### Property 5: Config_Module Sequelize instance reflects environment variables

*For any* valid combination of `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_HOST`, `DATABASE_DIALECT`, and `DATABASE_PORT` environment variables, the Sequelize instance created by `config/database.js` SHALL have its `config` properties set to exactly those values.

**Validates: Requirements 12.3**

---

### Property 6: Express error middleware responds with HTTP 500 for any thrown error

*For any* `Error` object passed to the Express error-handling middleware (the catch-all `(err, req, res, next)` handler), the middleware SHALL log the error using the Logger and respond with HTTP status `500`.

**Validates: Requirements 16.4**

---

## Error Handling

### Zlib decompression errors

The current code returns a string like `"Error decompressing description: ..."` from getters, which can leak internal error details to the client and break search result rendering. After the fix, all compressed-field getters follow this pattern:

```js
get() {
  try {
    const value = this.getDataValue('fieldName');
    if (!value) return '';
    return zlib.inflateSync(Buffer.from(value, 'base64')).toString();
  } catch {
    return '';
  }
}
```

### Database connection errors

`connectToDatabase()` throws on failure. The `startServer()` function catches this, logs it via the Logger, and calls `process.exit(1)`. This prevents the server from starting in a broken state.

### Unhandled errors in route handlers

All async route handlers are wrapped with `express-async-handler` (already a dependency) or use try/catch that calls `next(error)`. The catch-all error middleware is registered last:

```js
app.use((err, req, res, next) => {
  logger.error(err.stack || err.message);
  res.status(500).render('404', { error: 'Internal server error' });
});
```

### Process-level error handlers

```js
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
});
```

Note: `logs/logger.js` already registers an `unhandledRejection` handler. The one in `server.js` will replace it to avoid duplicate registration — the logger module's handler should be removed.

### Graceful shutdown

```js
const shutdown = async (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully.`);
  server.close(async () => {
    try {
      await sequelize.close();
      logger.info('Database connection closed.');
    } catch (err) {
      logger.error('Error closing database connection:', err);
    }
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
```

---

## Testing Strategy

### Dual approach

Unit tests cover specific examples, edge cases, and error conditions. Property-based tests verify universal properties across many generated inputs. Both are necessary for comprehensive coverage.

### Property-based testing library

**[fast-check](https://github.com/dubzzz/fast-check)** — TypeScript/JavaScript PBT library, well-maintained, works with any test runner. Install as a devDependency: `npm install --save-dev fast-check`.

Each property test runs a minimum of **100 iterations** (fast-check default is 100; configure with `{ numRuns: 100 }`).

### Property test specifications

Each property test is tagged with a comment referencing the design property:
`// Feature: app-refactor-dockerize, Property N: <property_text>`

**Property 1 — Search parameterization**
- Arbitraries: `fc.string()` including SQL metacharacter strings, multi-word queries
- Test: call the search query builder with the generated string; assert the resulting Sequelize `where` object contains only `Op.like` keys with the term as a value; assert no `Sequelize.literal()` call was made
- Mock: `stage.findAndCountAll` to capture the `where` argument

**Property 2 — CORS origin from env**
- Arbitraries: `fc.webUrl()` for FRONTEND_URL values
- Test: set `process.env.FRONTEND_URL` to the generated URL; re-require the CORS config builder; assert the `origin` option equals the generated URL
- Note: test the CORS configuration factory function in isolation, not the full server

**Property 3 — Role middleware logging**
- Arbitraries: `fc.string()` for role values, `fc.array(fc.string())` for allowed-roles lists
- Test: spy on `console.log` and `logger.warn`; call the middleware; assert `console.log` was never called; assert `logger.warn` was called iff the role is not in the allowed list; assert the warn message does not contain the role value
- Mock: `req.role`, `req.path`, `req.method`, `req.flash`, `res.render`, `res.redirect`, `next`

**Property 4 — Compressed field error handling**
- Arbitraries: `fc.string()` for invalid base64 values, `fc.uint8Array()` for random byte sequences encoded as base64
- Test: set the raw data value on a model instance; call the getter; assert the result is `''`
- Note: test the getter function directly, not through a DB query

**Property 5 — Config_Module env var mapping**
- Arbitraries: `fc.record({ DATABASE_NAME: fc.string(), DATABASE_USER: fc.string(), ... })`
- Test: set env vars to generated values; re-require `config/database.js` (with module cache cleared); assert `sequelize.config` matches the generated values
- Note: use `jest.resetModules()` or equivalent between iterations

**Property 6 — Error middleware HTTP 500**
- Arbitraries: `fc.record({ message: fc.string(), stack: fc.option(fc.string()) })` as Error-like objects
- Test: call the error middleware with the generated error; assert `res.status` was called with `500`; assert `logger.error` was called

### Unit test specifications

- **Req 1.6**: `startServer()` calls `connectToDatabase()` and `syncAllModels()` — mock both, verify calls
- **Req 3.4**: empty/absent `q` parameter → redirect to `/home`
- **Req 4.3**: `FRONTEND_URL` unset → CORS origin defaults to `http://localhost:3000`
- **Req 11.3**: rate limit exceeded → HTTP 429 with plain-text message
- **Req 16.3**: `SIGTERM`/`SIGINT` → `server.close()` and `sequelize.close()` called

### Smoke tests (configuration checks)

These are single-execution checks that verify structural correctness:

- `package.json` has correct dependency versions and no forbidden packages
- `config/database.js` does not call `authenticate()` or `sync()` at module load
- All model files do not call `sync()` at module load
- `server.js` applies `helmet` before route registration
- `server.js` uses `express.static('public')` not project root
- `.env.example` contains all required keys and no real credentials
- `Dockerfile` uses `node:20-alpine` and `npm ci --omit=dev`

### Test runner

Use **Jest** (standard for Node.js/Express projects). Add to `devDependencies`:
```json
"jest": "^29.0.0",
"fast-check": "^3.0.0"
```

Add to `package.json` scripts:
```json
"test": "jest --runInBand"
```
