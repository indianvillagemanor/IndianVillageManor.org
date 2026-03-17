import {
  escapeHtml,
  sanitizeString,
  sanitizeFilename,
  normalizeDownloadFilename,
  sanitizeEmail,
  hasSqlInjectionPatterns,
} from '@/lib/sanitize';

describe('sanitize', () => {
  describe('escapeHtml', () => {
    it('escapes HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    it('escapes ampersands', () => {
      expect(escapeHtml('foo & bar')).toBe('foo &amp; bar');
    });

    it('escapes single quotes', () => {
      expect(escapeHtml("it's")).toBe('it&#x27;s');
    });

    it('returns empty string for empty input', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('does not modify safe strings', () => {
      expect(escapeHtml('Hello World 123')).toBe('Hello World 123');
    });
  });

  describe('sanitizeString', () => {
    it('trims whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('removes null bytes', () => {
      expect(sanitizeString('hello\0world')).toBe('helloworld');
    });

    it('handles empty string', () => {
      expect(sanitizeString('')).toBe('');
    });
  });

  describe('sanitizeFilename', () => {
    it('removes path traversal', () => {
      expect(sanitizeFilename('../../etc/passwd')).toBe('etcpasswd');
    });

    it('removes path separators', () => {
      expect(sanitizeFilename('dir/file\\name.txt')).toBe('dirfilename.txt');
    });

    it('replaces special characters and collapses underscores', () => {
      expect(sanitizeFilename('file name (1).txt')).toBe('file_name_1_.txt');
    });

    it('removes leading dots', () => {
      expect(sanitizeFilename('.hidden_file')).toBe('hidden_file');
    });

    it('removes null bytes', () => {
      expect(sanitizeFilename('file\0name.txt')).toBe('filename.txt');
    });
  });

  describe('normalizeDownloadFilename', () => {
    it('removes a generated hex prefix from stored filenames', () => {
      expect(normalizeDownloadFilename('8a9b2c3d_Committee_Minutes.pdf')).toBe('Committee_Minutes.pdf');
    });

    it('removes mixed-case hex prefixes', () => {
      expect(normalizeDownloadFilename('Ab12Cd34_March_Newsletter.pdf')).toBe('March_Newsletter.pdf');
    });

    it('leaves filenames without the generated prefix unchanged', () => {
      expect(normalizeDownloadFilename('Committee_Minutes.pdf')).toBe('Committee_Minutes.pdf');
    });

    it('preserves filenames with additional underscores after the prefix', () => {
      expect(normalizeDownloadFilename('8a9b2c3d_board_packet_final_v2.pdf')).toBe('board_packet_final_v2.pdf');
    });

    it('does not strip non-matching prefixes', () => {
      expect(normalizeDownloadFilename('abc123_report.pdf')).toBe('abc123_report.pdf');
    });
  });

  describe('sanitizeEmail', () => {
    it('lowercases email', () => {
      expect(sanitizeEmail('User@Example.COM')).toBe('user@example.com');
    });

    it('trims whitespace', () => {
      expect(sanitizeEmail('  user@test.com  ')).toBe('user@test.com');
    });

    it('removes null bytes', () => {
      expect(sanitizeEmail('user\0@test.com')).toBe('user@test.com');
    });
  });

  describe('hasSqlInjectionPatterns', () => {
    it('detects SELECT FROM pattern', () => {
      expect(hasSqlInjectionPatterns("SELECT * FROM users")).toBe(true);
    });

    it('detects DROP TABLE pattern', () => {
      expect(hasSqlInjectionPatterns("'; DROP TABLE users; --")).toBe(true);
    });

    it('detects OR 1=1 pattern', () => {
      expect(hasSqlInjectionPatterns("' OR 1=1")).toBe(true);
    });

    it('does not flag normal text', () => {
      expect(hasSqlInjectionPatterns("John O'Brien")).toBe(false);
    });

    it('does not flag normal sentences', () => {
      expect(hasSqlInjectionPatterns("Please select the document from the list")).toBe(false);
    });
  });
});
