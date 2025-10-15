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

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000').replace(/\/$/, '');

export async function request<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    let errorBody: HttpErrorDetail | undefined;

    try {
      errorBody = await response.json();
    } catch (error) {
      // Ignore parsing errors
    }

    const message = errorBody?.title ?? `Erro ao comunicar com a API (${response.status})`;
    throw new HttpError(message, response.status, errorBody?.detail, errorBody?.errors);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const data = (await response.json()) as TResponse;
  return data;
}
