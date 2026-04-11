export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(statusCode: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function badRequest(message: string, details?: Record<string, unknown>): never {
  throw new ApiError(400, "bad_request", message, details);
}

export function notFound(message: string): never {
  throw new ApiError(404, "not_found", message);
}

export function forbidden(message: string): never {
  throw new ApiError(403, "forbidden", message);
}

export function unauthorized(message: string): never {
  throw new ApiError(401, "unauthorized", message);
}
