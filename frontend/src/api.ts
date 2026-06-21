/**
 * api.ts — Centralized API configuration
 *
 * All API calls across the app read the backend URL from this single file.
 * To change the backend URL, update only VITE_API_BASE_URL in your .env file
 * (locally) or in Vercel's Environment Variables dashboard (for production).
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
