export class HttpError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(msg = 'Bad request', details?: unknown) {
    return new HttpError(400, msg, 'BAD_REQUEST', details);
  }
  static unauthorized(msg = 'Unauthorized') {
    return new HttpError(401, msg, 'UNAUTHORIZED');
  }
  static forbidden(msg = 'Forbidden') {
    return new HttpError(403, msg, 'FORBIDDEN');
  }
  static notFound(msg = 'Not found') {
    return new HttpError(404, msg, 'NOT_FOUND');
  }
  static conflict(msg = 'Conflict') {
    return new HttpError(409, msg, 'CONFLICT');
  }
}
