export interface HttpErrorDetail {
  title: string;
  status: number;
  detail?: string;
  errors?: Record<string, string[]>;
}

export class HttpError extends Error {
  public readonly status: number;
  public readonly detail?: string;
  public readonly errors?: Record<string, string[]>;

  constructor(message: string, status: number, detail?: string, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.detail = detail;
    this.errors = errors;
  }
}

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000').replace(/\/$/, '');

export async function parseResponse<TResponse>(response: Response): Promise<TResponse> {
  if (!response.ok) {
    let errorBody: HttpErrorDetail | undefined;

    try {
      errorBody = await response.clone().json();
    } catch (error) {
      // Ignore parsing errors
    }

    const message = errorBody?.title ?? `Erro ao comunicar com a API (${response.status})`;
    throw new HttpError(message, response.status, errorBody?.detail, errorBody?.errors);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const text = await response.text();
  if (!text.trim()) {
    return undefined as TResponse;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  if (isJson) {
    return JSON.parse(text) as TResponse;
  }

  try {
    return JSON.parse(text) as TResponse;
  } catch (error) {
    return text as unknown as TResponse;
  }
}

export async function request<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init
  });

  return parseResponse<TResponse>(response);
}
