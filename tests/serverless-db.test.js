const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('database connection is shared, reused, and retried after failure', async () => {
  let attempts = 0;
  let resolveConnection;
  let rejectConnection;
  const mongoose = {
    connection: { readyState: 0, host: 'test' },
    connect: () => {
      attempts++;
      return new Promise((resolve, reject) => {
        resolveConnection = () => {
          mongoose.connection.readyState = 1;
          resolve(mongoose);
        };
        rejectConnection = reject;
      });
    },
  };
  const context = {
    require: () => mongoose,
    module: { exports: {} },
    process: { env: { MONGODB_URI: 'mongodb://test' } },
    console: { log() {} },
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../config/db'), 'utf8'), context);
  const connectDB = context.module.exports;
  const first = connectDB();
  const second = connectDB();
  assert.equal(attempts, 1);
  resolveConnection();
  assert.deepEqual(await Promise.all([first, second]), [mongoose, mongoose]);
  assert.equal(await connectDB(), mongoose);
  assert.equal(attempts, 1);

  mongoose.connection.readyState = 0;
  const failed = connectDB();
  rejectConnection(new Error('Database offline'));
  await assert.rejects(failed, /Database offline/);
  const retry = connectDB();
  assert.equal(attempts, 3);
  resolveConnection();
  assert.equal(await retry, mongoose);
});

test('exported server connects before registration and handles database failure', async () => {
  // Supply test values and replace the connector so no real database is used.
  process.env.MONGODB_URI = 'mongodb://test';
  process.env.JWT_SECRET = 'test-secret';
  process.env.NODE_ENV = 'production';
  const dbPath = require.resolve('../config/db');
  let attempts = 0;
  let fail = false;
  let connected = false;
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: async () => {
      attempts++;
      if (fail) throw new Error('Database offline');
      connected = true;
    },
  };
  const authService = require('../services/auth.service');
  authService.register = async () => {
    assert.equal(connected, true, 'registration must wait for the database');
    return { user: { name: 'Test' }, token: 'test-token' };
  };
  const app = require('../server');
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  const origin = 'https://journeylog-gilt.vercel.app';
  try {
    assert.equal((await fetch(`${base}/health`)).status, 200);
    assert.equal(attempts, 0);
    const preflight = await fetch(`${base}/auth/register`, {
      method: 'OPTIONS',
      headers: { Origin: origin, 'Access-Control-Request-Method': 'POST' },
    });
    assert.equal(preflight.status, 204);
    assert.equal(attempts, 0);
    const register = () => fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: '{}',
    });
    assert.equal((await register()).status, 201);
    assert.equal(attempts, 1);
    fail = true;
    const unavailable = await register();
    assert.equal(unavailable.status, 503);
    assert.equal(unavailable.headers.get('access-control-allow-origin'), origin);
    assert.equal((await unavailable.json()).code, 'DATABASE_UNAVAILABLE');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
