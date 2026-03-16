import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execFileAsync = promisify(execFile);

const THUMBNAILS_DIR = '/data/documents/thumbnails';

/**
 * Ensures the thumbnails directory exists.
 */
async function ensureThumbnailsDir(): Promise<void> {
  try {
    await fs.access(THUMBNAILS_DIR);
  } catch {
    await fs.mkdir(THUMBNAILS_DIR, { recursive: true });
  }
}

/**
 * Generates a PNG thumbnail of the first page of a PDF file using pdftoppm.
 * Returns the relative thumbnail path (e.g. "thumbnails/{documentId}.png") on success,
 * or null if generation fails (e.g. pdftoppm not installed or file unreadable).
 *
 * Arguments are passed as an array to execFile (not a shell string), preventing
 * command injection regardless of the PDF file path.
 *
 * @param pdfPath     Absolute path to the source PDF file
 * @param documentId  Document ID used to name the thumbnail file
 */
export async function generatePdfThumbnail(
  pdfPath: string,
  documentId: string
): Promise<string | null> {
  try {
    await ensureThumbnailsDir();

    // Output prefix: pdftoppm writes {prefix}-1.png for the first page
    const outputPrefix = path.join(THUMBNAILS_DIR, documentId);
    const expectedOutput = `${outputPrefix}-1.png`;
    const finalPath = path.join(THUMBNAILS_DIR, `${documentId}.png`);

    // Use execFile with an argument array (never a shell string) to avoid command injection.
    // -r 96:          96 DPI — good balance of size and clarity for a thumbnail
    // -f 1 -l 1:      only render first page
    // -png:           output as PNG
    // -scale-to-x 600 -scale-to-y -1: scale to 600 px wide, preserve aspect ratio
    await execFileAsync('pdftoppm', [
      '-r', '96',
      '-f', '1',
      '-l', '1',
      '-png',
      '-scale-to-x', '600',
      '-scale-to-y', '-1',
      pdfPath,
      outputPrefix,
    ]);

    // Rename pdftoppm output to a clean filename
    await fs.rename(expectedOutput, finalPath);

    // Return relative path used in DB
    return `thumbnails/${documentId}.png`;
  } catch (err) {
    // pdftoppm not available, or other failure — degrade gracefully
    console.warn(`PDF thumbnail generation failed for document ${documentId}:`, err);
    return null;
  }
}

/**
 * Deletes a previously generated thumbnail file.
 * Fails silently if the file does not exist.
 *
 * @param thumbnailPath  Relative path stored in the DB (e.g. "thumbnails/{id}.png")
 */
export async function deletePdfThumbnail(thumbnailPath: string): Promise<void> {
  try {
    const absPath = path.join('/data/documents', thumbnailPath);
    // Prevent path traversal: resolved path must be inside /data/documents
    const resolved = path.resolve(absPath);
    const resolvedBase = path.resolve('/data/documents');
    if (!resolved.startsWith(resolvedBase + path.sep) && resolved !== resolvedBase) return;
    await fs.unlink(resolved);
  } catch {
    // File may not exist — ignore
  }
}
