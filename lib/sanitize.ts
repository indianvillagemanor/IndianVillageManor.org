/**
 * Input sanitization utilities for XSS prevention.
 * Used to sanitize user-provided text before storage/display.
 */

// HTML entities to escape
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
};

/**
 * Escape HTML special characters to prevent XSS.
 */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Sanitize a string by trimming whitespace and removing null bytes.
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/\0/g, '') // Remove null bytes
    .trim();
}

/**
 * Sanitize filename: remove path traversal, special chars, normalize.
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/\0/g, '')           // Remove null bytes
    .replace(/\.\./g, '')          // Remove path traversal
    .replace(/[/\\]/g, '')         // Remove path separators
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_')       // Collapse multiple underscores
    .replace(/^\.+/, '')           // Remove leading dots
    .trim();
}

/**
 * Remove the generated upload prefix from a stored filename for download display.
 */
export function normalizeDownloadFilename(filename: string): string {
  return filename.replace(/^([0-9a-fA-F]{8})_/, '');
}

/**
 * Validate and sanitize an email address.
 */
export function sanitizeEmail(email: string): string {
  return email
    .replace(/\0/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Check for common SQL injection patterns (defense-in-depth).
 * Prisma parameterized queries already prevent SQL injection,
 * but this adds an extra layer of detection for logging.
 */
export function hasSqlInjectionPatterns(input: string): boolean {
  const patterns = [
    /(\bSELECT\b\s+\*\s+\bFROM\b)/i,             // SELECT * FROM
    /(\bSELECT\b\s+\w+\s*,)/i,                    // SELECT col, (column list)
    /(\bUNION\s+(ALL\s+)?SELECT\b)/i,              // UNION [ALL] SELECT
    /('.*(--))/,                                    // String escape + comment
    /(;\s*(DROP|ALTER|DELETE|INSERT|UPDATE))/i,     // Statement chaining
    /(\bOR\b\s+\d+\s*=\s*\d+)/i,                  // OR 1=1
    /(\bDROP\s+TABLE\b)/i,                         // DROP TABLE
    /(\bINSERT\s+INTO\b)/i,                        // INSERT INTO
  ];
  return patterns.some(pattern => pattern.test(input));
}
