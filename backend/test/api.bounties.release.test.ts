import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { vi } from 'vitest';

describe('POST /api/bounties/:id/release — integration test', () => {
  it('rejects non-existent bounty with 404', async () => {
    const res = await request(app)
      .post('/api/bounties/NONEXISTENT/release')
      .set('Content-Type', 'application/json')
      .send({ maintainer: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF' });
    expect([400, 404]).toContain(res.status);
  });

  it('rejects unauthenticated release attempt', async () => {
    const res = await request(app).post('/api/bounties/BNTY-1/release').send({});
    expect([400, 401, 403, 404]).toContain(res.status);
  });

  it('returns JSON error on invalid request', async () => {
    const res = await request(app).post('/api/bounties/INVALID/release').send({ txHash: '' });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body).toBeDefined();
  });

  it('does not re-execute the release effect on a duplicated idempotent request', async () => {
    const idempotencyKey = 'test-idempotency-key-release-1';
    const payload = {
      maintainer: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
    };

    const first = await request(app)
      .post('/api/bounties/BNTY-IDEMP/release')
      .set('Content-Type', 'application/json')
      .set('Idempotency-Key', idempotencyKey)
      .send(payload);

    const second = await request(app)
      .post('/api/bounties/BNTY-IDEMP/release')
      .set('Content-Type', 'application/json')
      .set('Idempotency-Key', idempotencyKey)
      .send(payload);

    expect(second.status).toBe(first.status);
    expect(second.body).toEqual(first.body);
  });
});
