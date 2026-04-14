import { ZodError } from "zod";

export class PaywayError extends Error {
  public readonly cause?: unknown;

  public constructor(message: string, cause?: unknown) {
    super(message);
    this.name = new.target.name;
    this.cause = cause;
  }
}

export class CredentialError extends PaywayError {}

export class RequestValidationError extends PaywayError {
  public readonly issues: ZodError["issues"];

  public constructor(
    message: string,
    issues: ZodError["issues"],
    cause?: unknown,
  ) {
    super(message, cause);
    this.issues = issues;
  }
}

export class ResponseValidationError extends PaywayError {
  public readonly issues: ZodError["issues"];
  public readonly payload: unknown;

  public constructor(
    message: string,
    issues: ZodError["issues"],
    payload: unknown,
    cause?: unknown,
  ) {
    super(message, cause);
    this.issues = issues;
    this.payload = payload;
  }
}

export class TransportError extends PaywayError {}

export class TimeoutError extends TransportError {
  public readonly timeoutMs: number;

  public constructor(message: string, timeoutMs: number, cause?: unknown) {
    super(message, cause);
    this.timeoutMs = timeoutMs;
  }
}

export class ApiError extends PaywayError {
  public readonly statusCode: number;
  public readonly payload: unknown;

  public constructor(
    message: string,
    statusCode: number,
    payload: unknown,
    cause?: unknown,
  ) {
    super(message, cause);
    this.statusCode = statusCode;
    this.payload = payload;
  }
}
