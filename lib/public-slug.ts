import path from 'path';

/**
 * Generate a short, title-derived public slug for a document.
 *
 * Format: <sanitized-title>-<4-char-random-suffix><ext>
 * Example: "HOA Budget 2026.pdf" → "hoa-budget-2026-a3k7.pdf"
 *
 * The random suffix makes collisions essentially impossible without
 * requiring any external dependencies.
 */
export function generatePublicSlug(title: string, filename: string): string {
  const ext = path.extname(filename).toLowerCase();

  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumeric runs → hyphen
    .replace(/^-+|-+$/g, '')     // trim leading/trailing hyphens
    .slice(0, 20)                // cap length
    .replace(/-+$/g, '');        // trim any trailing hyphen after slice

  const suffix = Math.random().toString(36).slice(2, 6); // 4 base-36 chars

  const stem = base || suffix; // fallback if title was all special chars
  return `${stem}-${suffix}${ext}`;
}
