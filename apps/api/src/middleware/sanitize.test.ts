import { describe, expect, it, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { mongoSanitize } from './sanitize';

function run(req: Partial<Request>): Partial<Request> {
  const next = vi.fn() as unknown as NextFunction;
  mongoSanitize(req as Request, {} as Response, next);
  expect(next).toHaveBeenCalledOnce();
  return req;
}

describe('mongoSanitize', () => {
  it('strips $-prefixed keys from body', () => {
    const out = run({ body: { email: 'a@b.c', $where: 'malicious' } });
    expect(out.body).toEqual({ email: 'a@b.c' });
  });

  it('strips dotted keys (path traversal)', () => {
    const out = run({ body: { 'a.b': 1, ok: 2 } });
    expect(out.body).toEqual({ ok: 2 });
  });

  it('cleans nested objects', () => {
    const out = run({ body: { user: { email: 'x', $gt: '' } } });
    expect(out.body).toEqual({ user: { email: 'x' } });
  });

  it('cleans inside arrays', () => {
    const out = run({ body: { items: [{ id: 1, $set: 'x' }] } });
    expect(out.body).toEqual({ items: [{ id: 1 }] });
  });

  it('also cleans query and params', () => {
    const out = run({
      body: {},
      query: { $or: 'x', q: 'safe' } as unknown as Request['query'],
      params: { $regex: 'x', id: '1' } as unknown as Request['params'],
    });
    expect(out.query).toEqual({ q: 'safe' });
    expect(out.params).toEqual({ id: '1' });
  });

  it('is a no-op when body is missing', () => {
    expect(() => run({})).not.toThrow();
  });
});
