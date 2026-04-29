import { describe, expect, it, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { requireObjectId } from './objectId';
import { HttpError } from '../utils/httpError';

function callMiddleware(params: Record<string, string>) {
  const next = vi.fn();
  const mw = requireObjectId('id');
  mw({ params } as unknown as Request, {} as Response, next as unknown as NextFunction);
  return next;
}

describe('requireObjectId', () => {
  it('passes valid ObjectId through', () => {
    const id = new Types.ObjectId().toString();
    const next = callMiddleware({ id });
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects invalid id with 404 HttpError', () => {
    const next = callMiddleware({ id: 'not-an-id' });
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(HttpError);
    expect(err.status).toBe(404);
  });

  it('rejects missing id', () => {
    const next = callMiddleware({});
    const err = next.mock.calls[0][0];
    expect(err.status).toBe(404);
  });
});
