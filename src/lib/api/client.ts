/**
 * Centralized API client base configuration.
 * All backend API calls go through here — never construct raw URLs in components.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export interface ApiError {
    status: number;
    message: string;
    detail?: string;
}

async function request<T>(
    path: string,
    options?: RequestInit
): Promise<T> {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
        ...options,
    });

    if (!res.ok) {
        let detail = '';
        try {
            const body = await res.json();
            detail = body?.detail ?? body?.message ?? '';
        } catch {
            detail = res.statusText;
        }
        throw {
            status: res.status,
            message: `API error ${res.status}: ${detail || res.statusText}`,
            detail,
        } as ApiError;
    }

    return res.json() as Promise<T>;
}

export const apiClient = {
    get: <T>(path: string) => request<T>(path, { method: 'GET' }),
    post: <T>(path: string, body: unknown) =>
        request<T>(path, {
            method: 'POST',
            body: JSON.stringify(body),
        }),
};
