export interface ErrorDetail {
  code: string | number;
  message: string;
  details?: Record<string, unknown>;
}

export interface ErrorResponse {
  success: false;
  error: ErrorDetail;
  path: string;
  timestamp: string;
}
