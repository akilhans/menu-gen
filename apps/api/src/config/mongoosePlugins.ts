import type { Schema } from 'mongoose';

/**
 * Normalizes documents serialized via toJSON / toObject so that:
 *  - `_id` is exposed as `id` (string) to match the shared frontend types
 *  - Mongoose internals (`_id`, `__v`) are removed from the payload
 *  - Sensitive fields (e.g. `passwordHash`) never leak through JSON responses
 */
export function idTransformPlugin(schema: Schema): void {
  const transform = (_doc: unknown, ret: Record<string, unknown>) => {
    if (ret._id != null) {
      ret.id = String(ret._id);
    }
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  };

  schema.set('toJSON', { virtuals: true, versionKey: false, transform });
  schema.set('toObject', { virtuals: true, versionKey: false, transform });
}
