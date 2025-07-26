// API Request/Response Types
export interface SendItemsRequest {
  password: string;
  items: string[];
}

export interface SendItemsResponse {
  status: 'success';
}

export interface ApiErrorResponse {
  error: string;
}

// Rate Limiting Types
export interface RateLimitInfo {
  count: number;
  timestamps: number[];
}

// Webhook Types
export interface WebhookPayload {
  items: string[];
}

// Environment Variables Types
export interface EnvironmentVariables {
  APP_PASSWORD: string;
  NODE_ENV?: 'development' | 'production' | 'test';
}

// Common Types
export type ApiResponse<T = any> = T | ApiErrorResponse;

// Type guards
export function isApiError(response: any): response is ApiErrorResponse {
  return response && typeof response.error === 'string';
}

export function isSendItemsResponse(response: any): response is SendItemsResponse {
  return response && response.status === 'success';
}