export class ApiError extends Error {
    statusCode;
    code;
    details;
    constructor(statusCode, code, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}
export function badRequest(message, details) {
    throw new ApiError(400, "bad_request", message, details);
}
export function notFound(message) {
    throw new ApiError(404, "not_found", message);
}
export function forbidden(message) {
    throw new ApiError(403, "forbidden", message);
}
export function unauthorized(message) {
    throw new ApiError(401, "unauthorized", message);
}
