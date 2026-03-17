'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface DocumentItem {
  id: string;
  title: string;
  filename: string;
  published: boolean;
  archived: boolean;
  deleted: boolean;
  isNewsletter: boolean;
  thumbnailPath: string | null;
  uploadedAt: string;
  uploadedBy: string;
  deletedAt: string | null;
}

// ---- Styles ----

const pageStyle: React.CSSProperties = {
  maxWidth: '960px',
  margin: '0 auto',
  padding: '24px 16px',
};

const headingStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: '#2d5016',
  marginBottom: '4px',
};

const subheadingStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  color: '#555',
  marginBottom: '28px',
};

const backLinkStyle: React.CSSProperties = {
  display: 'inline-block',
  marginBottom: '16px',
  color: '#2d5016',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontWeight: '500',
};

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 'bold',
  color: '#333',
  marginBottom: '12px',
  paddingBottom: '6px',
  borderBottom: '2px solid #e5e7eb',
};

const uploadBoxStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '24px',
  backgroundColor: '#f9fafb',
  marginBottom: '32px',
};

const fieldRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  flexWrap: 'wrap' as const,
  marginBottom: '16px',
};

const fieldGroupStyle: React.CSSProperties = {
  flex: 1,
  minWidth: '200px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.9rem',
  fontWeight: 'bold',
  color: '#333',
  marginBottom: '6px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '0.95rem',
  fontFamily: 'inherit',
  boxSizing: 'border-box' as const,
};

const primaryButtonStyle: React.CSSProperties = {
  padding: '10px 24px',
  backgroundColor: '#2d5016',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '0.95rem',
};

const disabledButtonStyle: React.CSSProperties = {
  opacity: 0.6,
  cursor: 'not-allowed',
};

const cardStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '16px 20px',
  marginBottom: '10px',
  backgroundColor: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
};

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '12px',
  flexWrap: 'wrap' as const,
};

const docTitleStyle: React.CSSProperties = {
  fontWeight: '600',
  color: '#333',
  fontSize: '0.98rem',
};

const docMetaStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  color: '#777',
  marginTop: '4px',
};

const badgeBase: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 9px',
  borderRadius: '12px',
  fontSize: '0.78rem',
  fontWeight: 'bold',
  marginRight: '6px',
};

const publishedBadge: React.CSSProperties = {
  ...badgeBase,
  backgroundColor: '#dcfce7',
  color: '#166534',
};

const archivedBadge: React.CSSProperties = {
  ...badgeBase,
  backgroundColor: '#fef9c3',
  color: '#854d0e',
};

const deletedBadge: React.CSSProperties = {
  ...badgeBase,
  backgroundColor: '#fee2e2',
  color: '#991b1b',
};

const draftBadge: React.CSSProperties = {
  ...badgeBase,
  backgroundColor: '#e5e7eb',
  color: '#374151',
};

const newsletterBadge: React.CSSProperties = {
  ...badgeBase,
  backgroundColor: '#dbeafe',
  color: '#1e40af',
};

const actionButtonStyle: React.CSSProperties = {
  padding: '6px 14px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.83rem',
  fontWeight: '600',
  backgroundColor: '#fff',
  marginLeft: '8px',
};

const dangerButtonStyle: React.CSSProperties = {
  ...actionButtonStyle,
  color: '#b91c1c',
  borderColor: '#fca5a5',
};

const errorStyle: React.CSSProperties = {
  padding: '14px',
  backgroundColor: '#fef2f2',
  color: '#b91c1c',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  marginBottom: '16px',
};

const successStyle: React.CSSProperties = {
  padding: '14px',
  backgroundColor: '#f0fdf4',
  color: '#166534',
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  marginBottom: '16px',
};

const emptyStyle: React.CSSProperties = {
  padding: '24px',
  textAlign: 'center',
  color: '#888',
  fontStyle: 'italic',
  fontSize: '0.95rem',
};

const sectionStyle: React.CSSProperties = { marginBottom: '32px' };

const renameTitleInputStyle: React.CSSProperties = {
  ...inputStyle,
  fontSize: '0.95rem',
  fontWeight: '600',
  maxWidth: '400px',
};

// ---- Helpers ----

function getBasename(filepath: string): string {
  return filepath.split('/').pop() || filepath;
}

function isPdf(filename: string): boolean {
  return filename.toLowerCase().endsWith('.pdf');
}

function getStatusBadge(doc: DocumentItem) {
  if (doc.deleted) return <span style={deletedBadge}>Deleted</span>;
  if (doc.published) return <span style={publishedBadge}>Published</span>;
  if (doc.archived) return <span style={archivedBadge}>Archived</span>;
  return <span style={draftBadge}>Draft</span>;
}

// ---- Component ----

export default function DocumentsManagePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const committeeId = params?.id as string;

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [committeeName, setCommitteeName] = useState('');
  const [hasNewsletterFeature, setHasNewsletterFeature] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Upload form
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isNewsletterUpload, setIsNewsletterUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Processing state for action buttons
  const [processing, setProcessing] = useState<string | null>(null);

  // Rename state
  const [renamingDocId, setRenamingDocId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [renameError, setRenameError] = useState('');
  const [renameProcessing, setRenameProcessing] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!committeeId) return;
    try {
      const res = await fetch(`/api/committees/${committeeId}/documents`);
      if (res.status === 401) {
        router.push('/auth/login');
        return;
      }
      if (res.status === 403 || res.status === 404) {
        router.push('/committees');
        return;
      }
      const data = await res.json();
      if (!data.canManage) {
        router.push(`/committees/${committeeId}`);
        return;
      }
      setDocuments(data.documents || []);
      setHasNewsletterFeature(data.hasNewsletterFeature || false);
    } catch {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [committeeId, router]);

  const fetchCommitteeName = useCallback(async () => {
    if (!committeeId) return;
    try {
      const res = await fetch(`/api/committees/${committeeId}`);
      if (res.ok) {
        const data = await res.json();
        setCommitteeName(data.committee?.name || '');
      }
    } catch {
      // Non-critical; ignore
    }
  }, [committeeId]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated') {
      const roles = session?.user?.roles || [];
      if (!roles.includes('publisher') && !roles.includes('dbadmin')) {
        router.push('/committees');
        return;
      }
      fetchDocuments();
      fetchCommitteeName();
    }
  }, [status, session, router, fetchDocuments, fetchCommitteeName]);

  // When file changes, reset the newsletter checkbox if not a PDF
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected && !isPdf(selected.name)) {
      setIsNewsletterUpload(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      setUploadError('Title and file are required');
      return;
    }
    if (isNewsletterUpload && !isPdf(file.name)) {
      setUploadError('Only PDF files can be marked as newsletters');
      return;
    }
    setUploading(true);
    setUploadError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('file', file);
    if (isNewsletterUpload) {
      formData.append('isNewsletter', 'true');
    }

    try {
      const res = await fetch(`/api/committees/${committeeId}/documents`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || 'Upload failed');
        return;
      }
      const newsLabel = isNewsletterUpload ? ' (Newsletter)' : '';
      setSuccess(`Document "${title.trim()}"${newsLabel} uploaded successfully.`);
      setTitle('');
      setFile(null);
      setIsNewsletterUpload(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      // Refresh documents
      await fetchDocuments();
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const startRename = (doc: DocumentItem) => {
    setRenamingDocId(doc.id);
    setRenameTitle(doc.title);
    setRenameError('');
  };

  const cancelRename = () => {
    setRenamingDocId(null);
    setRenameTitle('');
    setRenameError('');
  };

  const handleRename = async (docId: string) => {
    const trimmed = renameTitle.trim();
    if (!trimmed) {
      setRenameError('Title is required');
      return;
    }
    if (trimmed.length > 200) {
      setRenameError('Title must be 200 characters or fewer');
      return;
    }
    setRenameProcessing(true);
    setRenameError('');
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rename', title: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRenameError(data.error || 'Rename failed');
        return;
      }
      setSuccess(`Document renamed to "${trimmed}" successfully.`);
      setRenamingDocId(null);
      setRenameTitle('');
      await fetchDocuments();
    } catch {
      setRenameError('Rename failed. Please try again.');
    } finally {
      setRenameProcessing(false);
    }
  };

  const handleAction = async (
    docId: string,
    action: 'publish' | 'archive' | 'delete' | 'restore' | 'permanent' | 'set_newsletter' | 'unset_newsletter'
  ) => {
    setProcessing(docId + action);
    setError('');
    setSuccess('');

    try {
      let res: Response;

      if (action === 'publish' || action === 'archive' || action === 'set_newsletter' || action === 'unset_newsletter') {
        res = await fetch(`/api/documents/${docId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        });
      } else if (action === 'delete') {
        res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      } else if (action === 'restore') {
        res = await fetch(`/api/documents/${docId}/restore`, { method: 'POST' });
      } else {
        // permanent delete
        const confirmed = window.confirm(
          'Permanently delete this document? This cannot be undone.'
        );
        if (!confirmed) {
          setProcessing(null);
          return;
        }
        res = await fetch(`/api/documents/${docId}/permanent`, { method: 'DELETE' });
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Action "${action}" failed`);
        return;
      }

      const actionLabels: Record<string, string> = {
        publish: 'published',
        archive: 'archived',
        delete: 'moved to trash',
        restore: 'restored',
        permanent: 'permanently deleted',
        set_newsletter: 'marked as newsletter',
        unset_newsletter: 'unmarked as newsletter',
      };
      setSuccess(`Document ${actionLabels[action]} successfully.`);
      await fetchDocuments();
    } catch {
      setError(`Action failed. Please try again.`);
    } finally {
      setProcessing(null);
    }
  };

  // Split documents into groups
  const activeDocuments = documents.filter(d => !d.deleted);
  const deletedDocuments = documents.filter(d => d.deleted);

  if (status === 'loading' || loading) {
    return (
      <div style={pageStyle}>
        <p style={{ color: '#666' }}>Loading documents...</p>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <Link href={`/committees/${committeeId}`} style={backLinkStyle}>
        &larr; Back to Committee
      </Link>

      <h1 style={headingStyle}>Manage Documents</h1>
      <p style={subheadingStyle}>
        {committeeName ? `Committee: ${committeeName}` : 'Upload and manage committee documents.'}
      </p>

      {error && <div style={errorStyle}>{error}</div>}
      {success && <div style={successStyle}>{success}</div>}

      {/* Upload form */}
      <div style={uploadBoxStyle}>
        <div style={sectionHeadingStyle}>Upload New Document</div>
        <form onSubmit={handleUpload}>
          {uploadError && <div style={{ ...errorStyle, marginBottom: '12px' }}>{uploadError}</div>}
          <div style={fieldRowStyle}>
            <div style={fieldGroupStyle}>
              <label style={labelStyle} htmlFor="doc-title">
                Title <span style={{ color: '#b91c1c' }}>*</span>
              </label>
              <input
                id="doc-title"
                type="text"
                style={inputStyle}
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Meeting Minutes - January 2026"
                disabled={uploading}
                maxLength={200}
              />
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle} htmlFor="doc-file">
                File (PDF, JPG, PNG - max 25 MB) <span style={{ color: '#b91c1c' }}>*</span>
              </label>
              <input
                id="doc-file"
                type="file"
                ref={fileInputRef}
                style={{ ...inputStyle, padding: '7px' }}
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </div>
          </div>

          {/* Newsletter checkbox — only shown for committees with newsletter feature */}
          {hasNewsletterFeature && (
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {(() => {
                const newsletterDisabled = uploading || !file || !isPdf(file.name);
                return (
                  <>
                    <input
                      id="upload-is-newsletter"
                      type="checkbox"
                      checked={isNewsletterUpload}
                      onChange={e => setIsNewsletterUpload(e.target.checked)}
                      disabled={newsletterDisabled}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label
                      htmlFor="upload-is-newsletter"
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        color: newsletterDisabled ? '#aaa' : '#1e40af',
                        cursor: newsletterDisabled ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Newsletter{' '}
                      <span style={{ fontWeight: 'normal', color: '#666' }}>
                        (PDF files only — a thumbnail will be generated automatically)
                      </span>
                    </label>
                  </>
                );
              })()}
            </div>
          )}

          <button
            type="submit"
            style={{
              ...primaryButtonStyle,
              ...(uploading || !file || !title.trim() ? disabledButtonStyle : {}),
            }}
            disabled={uploading || !file || !title.trim()}
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </form>
      </div>

      {/* Active documents */}
      <div style={sectionStyle}>
        <div style={sectionHeadingStyle}>
          Documents ({activeDocuments.length})
        </div>
        {activeDocuments.length === 0 ? (
          <div style={emptyStyle}>No documents yet. Upload your first document above.</div>
        ) : (
          activeDocuments.map(doc => {
            const isProcessing =
              processing === doc.id + 'publish' ||
              processing === doc.id + 'archive' ||
              processing === doc.id + 'delete' ||
              processing === doc.id + 'set_newsletter' ||
              processing === doc.id + 'unset_newsletter';
            const isRenaming = renamingDocId === doc.id;
            const anyBusy = isProcessing || (isRenaming && renameProcessing);
            const canBeNewsletter = isPdf(doc.filename);
            return (
              <div key={doc.id} style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <div style={{ flex: 1 }}>
                    {isRenaming ? (
                      <div style={{ marginBottom: '6px' }}>
                        <input
                          type="text"
                          value={renameTitle}
                          onChange={e => { setRenameTitle(e.target.value); setRenameError(''); }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleRename(doc.id);
                            if (e.key === 'Escape') cancelRename();
                          }}
                          maxLength={200}
                          disabled={renameProcessing}
                          autoFocus
                          style={renameTitleInputStyle}
                          aria-label="Document title"
                        />
                        {renameError && (
                          <div style={{ color: '#b91c1c', fontSize: '0.82rem', marginTop: '4px' }}>{renameError}</div>
                        )}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <button
                            style={{ ...primaryButtonStyle, padding: '6px 16px', fontSize: '0.85rem', ...(renameProcessing ? disabledButtonStyle : {}) }}
                            onClick={() => handleRename(doc.id)}
                            disabled={renameProcessing}
                          >
                            {renameProcessing ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            style={{ ...actionButtonStyle, ...(renameProcessing ? disabledButtonStyle : {}) }}
                            onClick={cancelRename}
                            disabled={renameProcessing}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={docTitleStyle}>{doc.title}</div>
                    )}
                    <div style={docMetaStyle}>
                      {getBasename(doc.filename)} &middot; Uploaded{' '}
                      {new Date(doc.uploadedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div style={{ marginTop: '6px' }}>
                      {getStatusBadge(doc)}
                      {doc.isNewsletter && <span style={newsletterBadge}>Newsletter</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                    {/* Download link */}
                    <a
                      href={`/api/documents/${doc.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ ...actionButtonStyle, textDecoration: 'none', color: '#1e40af', borderColor: '#bfdbfe' }}
                    >
                      View
                    </a>

                    {/* Rename button — hidden while actively renaming this doc */}
                    {!isRenaming && (
                      <button
                        style={{ ...actionButtonStyle, color: '#374151', borderColor: '#d1d5db', ...(anyBusy ? disabledButtonStyle : {}) }}
                        onClick={() => startRename(doc)}
                        disabled={anyBusy}
                        title="Rename document"
                      >
                        Rename
                      </button>
                    )}

                    {/* Newsletter toggle — only for committees with newsletter feature and PDF files */}
                    {hasNewsletterFeature && canBeNewsletter && (
                      doc.isNewsletter ? (
                        <button
                          style={{ ...actionButtonStyle, color: '#6b21a8', borderColor: '#d8b4fe', ...(anyBusy ? disabledButtonStyle : {}) }}
                          onClick={() => handleAction(doc.id, 'unset_newsletter')}
                          disabled={anyBusy}
                          title="Remove newsletter designation"
                        >
                          Unmark Newsletter
                        </button>
                      ) : (
                        <button
                          style={{ ...actionButtonStyle, color: '#1e40af', borderColor: '#bfdbfe', ...(anyBusy ? disabledButtonStyle : {}) }}
                          onClick={() => handleAction(doc.id, 'set_newsletter')}
                          disabled={anyBusy}
                          title="Mark as newsletter (generates thumbnail)"
                        >
                          Mark as Newsletter
                        </button>
                      )
                    )}

                    {/* Draft (not published, not archived): Publish, Delete */}
                    {!doc.published && !doc.archived && (
                      <>
                        <button
                          style={{ ...actionButtonStyle, color: '#166534', borderColor: '#86efac', ...(anyBusy ? disabledButtonStyle : {}) }}
                          onClick={() => handleAction(doc.id, 'publish')}
                          disabled={anyBusy}
                        >
                          Publish
                        </button>
                        <button
                          style={{ ...dangerButtonStyle, ...(anyBusy ? disabledButtonStyle : {}) }}
                          onClick={() => handleAction(doc.id, 'delete')}
                          disabled={anyBusy}
                        >
                          Delete
                        </button>
                      </>
                    )}

                    {/* Published: Archive, Delete */}
                    {doc.published && (
                      <>
                        <button
                          style={{ ...actionButtonStyle, color: '#854d0e', borderColor: '#fde68a', ...(anyBusy ? disabledButtonStyle : {}) }}
                          onClick={() => handleAction(doc.id, 'archive')}
                          disabled={anyBusy}
                        >
                          Archive
                        </button>
                        <button
                          style={{ ...dangerButtonStyle, ...(anyBusy ? disabledButtonStyle : {}) }}
                          onClick={() => handleAction(doc.id, 'delete')}
                          disabled={anyBusy}
                        >
                          Delete
                        </button>
                      </>
                    )}

                    {/* Archived: Restore to published, Delete */}
                    {doc.archived && !doc.published && (
                      <>
                        <button
                          style={{ ...actionButtonStyle, color: '#166534', borderColor: '#86efac', ...(anyBusy ? disabledButtonStyle : {}) }}
                          onClick={() => handleAction(doc.id, 'publish')}
                          disabled={anyBusy}
                        >
                          Restore (Publish)
                        </button>
                        <button
                          style={{ ...dangerButtonStyle, ...(anyBusy ? disabledButtonStyle : {}) }}
                          onClick={() => handleAction(doc.id, 'delete')}
                          disabled={anyBusy}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Trash / Deleted documents */}
      {deletedDocuments.length > 0 && (
        <div style={sectionStyle}>
          <div style={{ ...sectionHeadingStyle, color: '#991b1b' }}>
            Trash ({deletedDocuments.length})
          </div>
          {deletedDocuments.map(doc => {
            const isProcessing =
              processing === doc.id + 'restore' ||
              processing === doc.id + 'permanent';
            return (
              <div key={doc.id} style={{ ...cardStyle, backgroundColor: '#fff5f5', borderColor: '#fecaca' }}>
                <div style={cardHeaderStyle}>
                  <div style={{ flex: 1 }}>
                    <div style={{ ...docTitleStyle, color: '#6b7280' }}>{doc.title}</div>
                    <div style={docMetaStyle}>
                      {getBasename(doc.filename)}
                      {doc.deletedAt && (
                        <> &middot; Deleted {new Date(doc.deletedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}</>
                      )}
                    </div>
                    <div style={{ marginTop: '6px' }}>
                      {getStatusBadge(doc)}
                      {doc.isNewsletter && <span style={newsletterBadge}>Newsletter</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                    <button
                      style={{ ...actionButtonStyle, color: '#166534', borderColor: '#86efac', ...(isProcessing ? disabledButtonStyle : {}) }}
                      onClick={() => handleAction(doc.id, 'restore')}
                      disabled={isProcessing}
                    >
                      Restore
                    </button>
                    <button
                      style={{ ...dangerButtonStyle, ...(isProcessing ? disabledButtonStyle : {}) }}
                      onClick={() => handleAction(doc.id, 'permanent')}
                      disabled={isProcessing}
                    >
                      Delete Permanently
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
