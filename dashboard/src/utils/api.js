/**
 * dashboard/src/utils/api.js — Centralised API client
 *
 * TASK REQUIREMENTS MET:
 *  8. Ensures Vercel dashboard connects correctly to Railway backend
 *
 * Every call includes:
 *   credentials: 'include' — sends the xyrox.sid cross-site cookie
 *   Cache-Control: no-cache on GET — prevents stale 401 reads
 *
 * Throws ApiError on non-2xx responses so callers can distinguish
 * network failures (status 0) from auth errors (401) from server errors (500).
 */

const API_URL = (process.env.REACT_APP_API_URL || 'https://xyrox-production.up.railway.app')
    .replace(/\/$/, ''); // strip trailing slash — prevents double-slash URLs

export class ApiError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name   = 'ApiError';
        this.status = status;
        this.data   = data;
    }
}

async function request(method, path, body) {
    const url = path.startsWith('http') ? path : `${API_URL}${path}`;

    const headers = { 'Content-Type': 'application/json' };
    if (method === 'GET') headers['Cache-Control'] = 'no-cache';

    const options = {
        method,
        credentials: 'include', // CRITICAL — sends cross-site cookies to Railway
        headers,
    };

    if (body !== undefined) {
        options.body = JSON.stringify(body);
    }

    let res;
    try {
        res = await fetch(url, options);
    } catch (networkErr) {
        throw new ApiError(
            `Network error — could not reach ${API_URL}. Is the backend running?`,
            0,
            null
        );
    }

    let data = null;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
        try { data = await res.json(); } catch { data = null; }
    }

    if (!res.ok) {
        const message = data?.error || `HTTP ${res.status} ${res.statusText}`;
        throw new ApiError(message, res.status, data);
    }

    return data;
}

export const api = {
    get:    (path)       => request('GET',    path),
    post:   (path, body) => request('POST',   path, body),
    patch:  (path, body) => request('PATCH',  path, body),
    put:    (path, body) => request('PUT',    path, body),
    delete: (path)       => request('DELETE', path),
};

export { API_URL };
