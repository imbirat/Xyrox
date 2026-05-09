/**
 * dashboard/src/utils/api.js — Centralised API client
 *
 * Every call includes:
 *   credentials: 'include'  — sends kythia.sid cross-site cookie (Vercel → Railway)
 *   Cache-Control: no-cache — prevents stale 401 reads on GET
 *
 * Throws ApiError on non-2xx responses.
 * Dashboard deployed at: https://xyrox.qzz.io
 * Backend deployed at:   https://xyrox-production.up.railway.app
 */

const API_URL = (import.meta.env.VITE_API_URL || 'https://xyrox-production.up.railway.app')
    .replace(/\/$/, '');

export const APP_URL = import.meta.env.VITE_APP_URL || 'https://xyrox.qzz.io';

export class ApiError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name   = 'ApiError';
        this.status = status;
        this.data   = data;
    }
}

async function request(method, path, body) {
    const url     = path.startsWith('http') ? path : `${API_URL}${path}`;
    const headers = { 'Content-Type': 'application/json' };
    if (method === 'GET') headers['Cache-Control'] = 'no-cache';

    const options = {
        method,
        credentials: 'include', // CRITICAL — cross-site cookie Vercel → Railway
        headers,
    };

    if (body !== undefined) options.body = JSON.stringify(body);

    let res;
    try {
        res = await fetch(url, options);
    } catch (networkErr) {
        throw new ApiError(
            `Network error — could not reach backend. Is the API running?`,
            0,
            null,
        );
    }

    let data = null;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
        try { data = await res.json(); } catch { data = null; }
    }

    if (!res.ok) {
        throw new ApiError(data?.error || `HTTP ${res.status} ${res.statusText}`, res.status, data);
    }

    return data;
}

export const api = {
    get:    (path)        => request('GET',    path),
    post:   (path, body)  => request('POST',   path, body),
    patch:  (path, body)  => request('PATCH',  path, body),
    put:    (path, body)  => request('PUT',    path, body),
    delete: (path)        => request('DELETE', path),
};

export { API_URL };
