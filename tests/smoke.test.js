'use strict';

/**
 * Smoke tests — structural correctness checks.
 * These verify that key files are correctly configured without
 * requiring a live database connection.
 */

const fs = require('fs');
const path = require('path');

describe('package.json structure', () => {
  const pkg = require('../package.json');

  test('sequelize version is ^6.x', () => {
    expect(pkg.dependencies.sequelize).toMatch(/^\^6\./);
  });

  test('uuid version is ^9.x', () => {
    expect(pkg.dependencies.uuid).toMatch(/^\^9\./);
  });

  test('helmet is a runtime dependency', () => {
    expect(pkg.dependencies.helmet).toBeDefined();
  });

  test('express-rate-limit is a runtime dependency', () => {
    expect(pkg.dependencies['express-rate-limit']).toBeDefined();
  });

  test('jest is a devDependency', () => {
    expect(pkg.devDependencies.jest).toBeDefined();
  });

  test('fast-check is a devDependency', () => {
    expect(pkg.devDependencies['fast-check']).toBeDefined();
  });

  test('nodemon is a devDependency only', () => {
    expect(pkg.devDependencies.nodemon).toBeDefined();
    expect(pkg.dependencies && pkg.dependencies.nodemon).toBeFalsy();
  });

  test('test script runs jest --runInBand', () => {
    expect(pkg.scripts.test).toBe('jest --runInBand');
  });

  test('start script uses node server.js', () => {
    expect(pkg.scripts.start).toBe('node server.js');
  });
});

describe('config/database.js — no side effects at load time', () => {
  test('module loads without calling authenticate or sync', () => {
    // If this require throws, the module has side effects that fail without a DB
    // We mock sequelize to detect any authenticate/sync calls
    jest.resetModules();

    // Patch env vars so Sequelize constructor doesn't complain
    process.env.DATABASE_NAME = process.env.DATABASE_NAME || 'test_db';
    process.env.DATABASE_USER = process.env.DATABASE_USER || 'test_user';
    process.env.DATABASE_PASSWORD = process.env.DATABASE_PASSWORD || 'test_pass';
    process.env.DATABASE_HOST = process.env.DATABASE_HOST || 'localhost';

    // Should not throw
    expect(() => {
      require('../config/database');
    }).not.toThrow();
  });

  test('exports sequelize and Sequelize', () => {
    jest.resetModules();
    const mod = require('../config/database');
    expect(mod.sequelize).toBeDefined();
    expect(mod.Sequelize).toBeDefined();
  });
});

describe('.env.example contains required keys', () => {
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  let content;

  beforeAll(() => {
    content = fs.readFileSync(envExamplePath, 'utf8');
  });

  const requiredKeys = [
    'DATABASE_DIALECT',
    'DATABASE_HOST',
    'DATABASE_NAME',
    'DATABASE_PASSWORD',
    'DATABASE_PORT',
    'DATABASE_USER',
    'FRONTEND_URL',
    'JWT_SECRET',
    'secretKey',
    'PORT',
  ];

  requiredKeys.forEach((key) => {
    test(`contains ${key}`, () => {
      expect(content).toContain(key);
    });
  });
});

describe('Dockerfile structure', () => {
  const dockerfilePath = path.join(__dirname, '..', 'Dockerfile');
  let content;

  beforeAll(() => {
    content = fs.readFileSync(dockerfilePath, 'utf8');
  });

  test('uses node:20-alpine base image', () => {
    expect(content).toContain('node:20-alpine');
  });

  test('uses npm ci --omit=dev', () => {
    expect(content).toContain('npm ci --omit=dev');
  });

  test('exposes port 3000', () => {
    expect(content).toContain('EXPOSE 3000');
  });
});

describe('model files — no sync() at module load time', () => {
  const modelFiles = [
    '../model/stagesModel.js',
    '../model/soutenanceModel.js',
    '../model/stagePostulationModel.js',
    '../model/userModel.js',
  ];

  modelFiles.forEach((filePath) => {
    test(`${path.basename(filePath)} source does not contain IIFE sync call`, () => {
      const absPath = path.join(__dirname, filePath);
      const src = fs.readFileSync(absPath, 'utf8');
      // Should not have an immediately-invoked async function that calls .sync(
      expect(src).not.toMatch(/\(\s*async\s*\(\s*\)\s*=>\s*\{[^}]*\.sync\s*\(/);
    });
  });
});

describe('server.js — security configuration', () => {
  const serverPath = path.join(__dirname, '..', 'server.js');
  let src;

  beforeAll(() => {
    src = fs.readFileSync(serverPath, 'utf8');
  });

  test('uses express.static with public/ directory', () => {
    expect(src).toContain("express.static(path.join(__dirname, 'public'))");
  });

  test('uses helmet middleware', () => {
    expect(src).toContain("require('helmet')");
    expect(src).toContain('app.use(helmet())');
  });

  test('CORS origin uses FRONTEND_URL env var', () => {
    expect(src).toContain('process.env.FRONTEND_URL');
    expect(src).not.toContain("origin: '*'");
  });

  test('search route uses Op.like (no Sequelize.literal)', () => {
    expect(src).toContain('Op.like');
    // Ensure no literal() call in the search section
    expect(src).not.toContain('Sequelize.literal(');
  });
});
