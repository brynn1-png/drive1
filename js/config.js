/**
 * js/config.js
 * -----------
 * ⚠️  FILL IN YOUR SUPABASE CREDENTIALS BEFORE RUNNING.
 *
 * How to find them:
 *   Supabase Dashboard → Project Settings → API
 *   • Project URL  → SUPABASE_URL
 *   • anon/public  → SUPABASE_ANON_KEY
 */

const SUPABASE_URL = "https://inochweyrowojfrumclj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlub2Nod2V5cm93b2pmcnVtY2xqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxOTUzODMsImV4cCI6MjA5Nzc3MTM4M30.aze2HnR7PznHcK9Z3H4nXuOO5UoGw3P15w5AOOh8ihA";

/** Name of the Supabase Storage bucket. Create it in the dashboard. */
const BUCKET_NAME = "drive";

/** Max upload size enforced client-side (50 MB = Supabase free tier limit). */
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

/** Allowed image MIME types that will render as thumbnails. */
const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
];
