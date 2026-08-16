'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface CommitteeDocument {
  id: string;
  title: string;
  uploadedAt: string;
  archived: boolean;
}

interface CommitteeMember {
  id: string;
  firstName: string;
  lastName: string;
  unitNumber: string;
}

interface CommitteeEvent {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  createdAt: string;
}

interface CommitteeDetail {
  id: string;
  name: string;
  description: string | null;
  documents: CommitteeDocument[];
  members: CommitteeMember[];
  _count: {
    members: number;
    documents: number;
  };
}

interface ViewerInfo {
  isAdmin: boolean;
  isPublisher: boolean;
  isMember: boolean;
}

// --- Styles ---

const pageStyle: React.CSSProperties = {
  maxWidth: '900px',
  margin: '0 auto',
  padding: '24px 16px',
};

const headingRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '8px',
  flexWrap: 'wrap',
  gap: '12px',
};

const headingStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: '#2d5016',
  margin: 0,
};

const descStyle: React.CSSProperties = {
  fontSize: '1rem',
  color: '#555',
  marginBottom: '28px',
  lineHeight: '1.6',
};

const sectionHeadingRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px',
  paddingBottom: '6px',
  borderBottom: '2px solid #e5e7eb',
};

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 'bold',
  color: '#333',
  margin: 0,
};

const cardStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '16px 20px',
  marginBottom: '10px',
  backgroundColor: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const eventCardStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '16px 20px',
  marginBottom: '10px',
  backgroundColor: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
};

const eventCardPastStyle: React.CSSProperties = {
  ...eventCardStyle,
  opacity: 0.65,
  backgroundColor: '#f9f9f9',
};

const docTitleStyle: React.CSSProperties = {
  fontWeight: '600',
  color: '#333',
  fontSize: '0.98rem',
};

const docDateStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#777',
  marginTop: '2px',
};

const memberCardStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '12px 16px',
  marginBottom: '8px',
  backgroundColor: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '0.78rem',
  fontWeight: 'bold',
  backgroundColor: '#fef9c3',
  color: '#854d0e',
};

const pastBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '0.75rem',
  backgroundColor: '#e5e7eb',
  color: '#6b7280',
  padding: '2px 8px',
  borderRadius: '4px',
  fontWeight: 'bold',
  marginLeft: '8px',
  verticalAlign: 'middle',
};

const adminActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
};

const manageLinkStyle: React.CSSProperties = {
  padding: '8px 18px',
  backgroundColor: '#2d5016',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '0.9rem',
  textDecoration: 'none',
  display: 'inline-block',
};

const addBtnStyle: React.CSSProperties = {
  padding: '6px 16px',
  backgroundColor: '#00693f',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '0.85rem',
};

const editBtnStyle: React.CSSProperties = {
  padding: '5px 12px',
  backgroundColor: '#2d5016',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.82rem',
  fontWeight: 'bold',
};

const deleteBtnStyle: React.CSSProperties = {
  padding: '5px 12px',
  backgroundColor: '#b91c1c',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.82rem',
  fontWeight: 'bold',
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '8px 18px',
  backgroundColor: '#e5e7eb',
  color: '#374151',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '0.9rem',
};

const saveBtnStyle: React.CSSProperties = {
  padding: '8px 20px',
  backgroundColor: '#00693f',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '0.9rem',
};

const disabledBtnStyle: React.CSSProperties = {
  opacity: 0.55,
  cursor: 'not-allowed',
};

const backLinkStyle: React.CSSProperties = {
  display: 'inline-block',
  marginBottom: '16px',
  color: '#2d5016',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontWeight: '500',
};

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '24px 16px',
  color: '#888',
  fontSize: '0.95rem',
  fontStyle: 'italic',
};

const errorStyle: React.CSSProperties = {
  padding: '16px',
  backgroundColor: '#fef2f2',
  color: '#b91c1c',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  marginBottom: '16px',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: '32px',
};

const formBoxStyle: React.CSSProperties = {
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  padding: '20px 24px',
  backgroundColor: '#f9fafb',
  marginBottom: '16px',
};

const fieldGroupStyle: React.CSSProperties = {
  marginBottom: '14px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontWeight: 'bold',
  color: '#374151',
  marginBottom: '5px',
  fontSize: '0.9rem',
};

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '8px 10px',
  border: '1px solid #d1d5db',
  borderRadius: '5px',
  fontSize: '0.9rem',
  boxSizing: 'border-box' as const,
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical' as const,
  minHeight: '70px',
  fontFamily: 'inherit',
};

const formRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap' as const,
};

const formBtnRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  justifyContent: 'flex-end',
  marginTop: '16px',
};

const confirmOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const confirmBoxStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '10px',
  padding: '28px 32px',
  maxWidth: '420px',
  width: '90%',
  boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
};

const fieldErrorStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  color: '#b91c1c',
  marginTop: '3px',
};

// --- Helpers ---

function formatEventDate(startAt: string, endAt: string | null): string {
  const start = new Date(startAt);
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' };
  const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  let result = start.toLocaleDateString('en-US', dateOptions) + ' at ' + start.toLocaleTimeString('en-US', timeOptions);
  if (endAt) {
    const end = new Date(endAt);
    if (start.toDateString() === end.toDateString()) {
      result += ' – ' + end.toLocaleTimeString('en-US', timeOptions);
    } else {
      result += ' – ' + end.toLocaleDateString('en-US', dateOptions) + ' at ' + end.toLocaleTimeString('en-US', timeOptions);
    }
  }
  return result;
}

function isPast(startAt: string): boolean {
  return new Date(startAt) < new Date();
}

// Convert an ISO date string to datetime-local input value (YYYY-MM-DDTHH:mm)
function toDatetimeLocal(isoStr: string | null | undefined): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

// --- Event Form (shared for create and edit) ---

interface EventFormState {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
}

interface EventFormErrors {
  title?: string;
  startAt?: string;
  endAt?: string;
}

function validateEventForm(form: EventFormState): EventFormErrors {
  const errors: EventFormErrors = {};
  if (!form.title.trim()) errors.title = 'Title is required.';
  if (!form.startAt) errors.startAt = 'Start date and time are required.';
  if (form.endAt && form.startAt) {
    if (new Date(form.endAt) <= new Date(form.startAt)) {
      errors.endAt = 'End date/time must be after the start date/time.';
    }
  }
  return errors;
}

// --- Main Component ---

export default function CommitteeDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const committeeId = params?.id as string;

  const [committee, setCommittee] = useState<CommitteeDetail | null>(null);
  const [viewerInfo, setViewerInfo] = useState<ViewerInfo>({ isAdmin: false, isPublisher: false, isMember: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Events state
  const [events, setEvents] = useState<CommitteeEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState('');

  // Create event form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<EventFormState>({ title: '', description: '', startAt: '', endAt: '' });
  const [createErrors, setCreateErrors] = useState<EventFormErrors>({});
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit event form
  const [editingEvent, setEditingEvent] = useState<CommitteeEvent | null>(null);
  const [editForm, setEditForm] = useState<EventFormState>({ title: '', description: '', startAt: '', endAt: '' });
  const [editErrors, setEditErrors] = useState<EventFormErrors>({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<CommitteeEvent | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const canManageEvents = useMemo(
    () => viewerInfo.isAdmin || (session?.user?.roles?.includes('calendar') === true && viewerInfo.isMember),
    [viewerInfo.isAdmin, viewerInfo.isMember, session?.user?.roles]
  );

  const fetchCommittee = useCallback(async () => {
    if (!committeeId) return;
    try {
      const res = await fetch(`/api/committees/${committeeId}`);
      if (res.status === 401) { router.push('/auth/login'); return; }
      if (res.status === 403 || res.status === 404) { router.push('/committees'); return; }
      const data = await res.json();
      setCommittee(data.committee);
      setViewerInfo(data.viewerInfo);
    } catch {
      setError('Failed to load committee details');
    } finally {
      setLoading(false);
    }
  }, [committeeId, router]);

  const fetchEvents = useCallback(async () => {
    if (!committeeId) return;
    setEventsLoading(true);
    try {
      const res = await fetch(`/api/committees/${committeeId}/events`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch {
      setEventsError('Failed to load events');
    } finally {
      setEventsLoading(false);
    }
  }, [committeeId]);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/login'); return; }
    if (status === 'authenticated') { fetchCommittee(); }
  }, [status, router, fetchCommittee]);

  useEffect(() => {
    if (!loading && committee) { fetchEvents(); }
  }, [loading, committee, fetchEvents]);

  // Create event handlers
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    const errors = validateEventForm(createForm);
    setCreateErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setCreateSubmitting(true);
    try {
      const res = await fetch(`/api/committees/${committeeId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createForm.title.trim(),
          description: createForm.description.trim() || undefined,
          startAt: new Date(createForm.startAt).toISOString(),
          endAt: createForm.endAt ? new Date(createForm.endAt).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error || 'Failed to create event.'); return; }
      setShowCreateForm(false);
      setCreateForm({ title: '', description: '', startAt: '', endAt: '' });
      setCreateErrors({});
      await fetchEvents();
    } catch {
      setCreateError('An unexpected error occurred. Please try again.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Edit event handlers
  const handleEditOpen = (event: CommitteeEvent) => {
    setEditingEvent(event);
    setEditForm({
      title: event.title,
      description: event.description || '',
      startAt: toDatetimeLocal(event.startAt),
      endAt: toDatetimeLocal(event.endAt),
    });
    setEditErrors({});
    setEditError('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    setEditError('');
    const errors = validateEventForm(editForm);
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title.trim(),
          description: editForm.description.trim() || undefined,
          startAt: new Date(editForm.startAt).toISOString(),
          endAt: editForm.endAt ? new Date(editForm.endAt).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error || 'Failed to update event.'); return; }
      setEditingEvent(null);
      await fetchEvents();
    } catch {
      setEditError('An unexpected error occurred. Please try again.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Delete handlers
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch(`/api/events/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error || 'Failed to delete event.');
        return;
      }
      setDeleteTarget(null);
      await fetchEvents();
    } catch {
      setDeleteError('Failed to delete event. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (status === 'loading' || loading) {
    return <div style={pageStyle}><p style={{ color: '#666' }}>Loading committee details...</p></div>;
  }

  if (!committee) {
    return (
      <div style={pageStyle}>
        {error && <div style={errorStyle}>{error}</div>}
        <p style={{ color: '#666' }}>Committee not found.</p>
      </div>
    );
  }

  const canSeeMembers = viewerInfo.isAdmin || viewerInfo.isMember;
  const canManageDocs = viewerInfo.isAdmin || (viewerInfo.isPublisher && viewerInfo.isMember);

  return (
    <div style={pageStyle}>
      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div style={confirmOverlayStyle}>
          <div style={confirmBoxStyle}>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '10px' }}>
              Delete Event?
            </div>
            <div style={{ color: '#555', marginBottom: '18px', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Are you sure you want to delete &ldquo;{deleteTarget.title}&rdquo;? This action cannot be undone.
            </div>
            {deleteError && <div style={{ ...errorStyle, marginBottom: '12px' }}>{deleteError}</div>}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button style={cancelBtnStyle} onClick={() => { setDeleteTarget(null); setDeleteError(''); }} disabled={deleting}>
                Cancel
              </button>
              <button
                style={{ ...deleteBtnStyle, ...(deleting ? disabledBtnStyle : {}), padding: '8px 18px', fontSize: '0.9rem' }}
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Link href="/committees" style={backLinkStyle}>&larr; Back to Committees</Link>

      <div style={headingRowStyle}>
        <h1 style={headingStyle}>{committee.name}</h1>
        <div style={adminActionsStyle}>
          {viewerInfo.isAdmin && (
            <Link href={`/admin/committees/${committee.id}`} style={manageLinkStyle}>
              Edit / Manage Members
            </Link>
          )}
          {canManageDocs && (
            <Link href={`/committees/${committee.id}/documents`} style={manageLinkStyle}>
              Manage Documents
            </Link>
          )}
          {!viewerInfo.isAdmin && viewerInfo.isMember && !canManageDocs && (
            <span style={{ padding: '4px 10px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 'bold' }}>
              You are a member
            </span>
          )}
        </div>
      </div>

      {committee.description && <p style={descStyle}>{committee.description}</p>}
      {error && <div style={errorStyle}>{error}</div>}

      {/* Published Documents */}
      <div style={sectionStyle}>
        <div style={sectionHeadingRowStyle}>
          <div style={sectionHeadingStyle}>Published Documents ({committee.documents.length})</div>
        </div>
        {committee.documents.length === 0 ? (
          <div style={emptyStyle}>No published documents at this time.</div>
        ) : (
          <div>
            {committee.documents.map(doc => (
              <div key={doc.id} style={cardStyle}>
                <div>
                  <div style={docTitleStyle}>{doc.title}</div>
                  <div style={docDateStyle}>
                    Uploaded {new Date(doc.uploadedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {doc.archived && <span style={badgeStyle}>Archived</span>}
                  <a href={`/api/documents/${doc.id}/download`} target="_blank" rel="noopener noreferrer"
                    style={{ padding: '6px 14px', backgroundColor: '#2d5016', color: '#fff', borderRadius: '4px', fontSize: '0.83rem', fontWeight: 'bold', textDecoration: 'none' }}>
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Events */}
      <div style={sectionStyle}>
        <div style={sectionHeadingRowStyle}>
          <div style={sectionHeadingStyle}>
            Events ({events.length})
          </div>
          {canManageEvents && !showCreateForm && !editingEvent && (
            <button style={addBtnStyle} onClick={() => { setShowCreateForm(true); setCreateForm({ title: '', description: '', startAt: '', endAt: '' }); setCreateErrors({}); setCreateError(''); }}>
              + Add Event
            </button>
          )}
        </div>

        {eventsError && <div style={errorStyle}>{eventsError}</div>}

        {/* Create event form */}
        {showCreateForm && canManageEvents && (
          <div style={formBoxStyle}>
            <div style={{ fontWeight: 'bold', color: '#2d5016', marginBottom: '14px', fontSize: '1rem' }}>New Event</div>
            {createError && <div style={{ ...errorStyle, marginBottom: '12px' }}>{createError}</div>}
            <form onSubmit={handleCreateSubmit} noValidate>
              <div style={fieldGroupStyle}>
                <label style={labelStyle} htmlFor="create-title">Title <span style={{ color: '#b91c1c' }}>*</span></label>
                <input id="create-title" type="text" style={inputStyle} value={createForm.title} maxLength={255}
                  onChange={e => { setCreateForm(f => ({ ...f, title: e.target.value })); setCreateErrors(err => ({ ...err, title: undefined })); }}
                  disabled={createSubmitting} placeholder="Event title" />
                {createErrors.title && <div style={fieldErrorStyle}>{createErrors.title}</div>}
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle} htmlFor="create-description">Description <span style={{ fontWeight: 'normal', color: '#6b7280' }}>(optional)</span></label>
                <textarea id="create-description" style={textareaStyle} value={createForm.description}
                  onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                  disabled={createSubmitting} placeholder="Additional details..." />
              </div>
              <div style={formRowStyle}>
                <div style={{ flex: 1, minWidth: '200px', ...fieldGroupStyle }}>
                  <label style={labelStyle} htmlFor="create-startAt">Start Date &amp; Time <span style={{ color: '#b91c1c' }}>*</span></label>
                  <input id="create-startAt" type="datetime-local" style={inputStyle} value={createForm.startAt}
                    onChange={e => { setCreateForm(f => ({ ...f, startAt: e.target.value })); setCreateErrors(err => ({ ...err, startAt: undefined })); }}
                    disabled={createSubmitting} />
                  {createErrors.startAt && <div style={fieldErrorStyle}>{createErrors.startAt}</div>}
                </div>
                <div style={{ flex: 1, minWidth: '200px', ...fieldGroupStyle }}>
                  <label style={labelStyle} htmlFor="create-endAt">End Date &amp; Time <span style={{ fontWeight: 'normal', color: '#6b7280' }}>(optional)</span></label>
                  <input id="create-endAt" type="datetime-local" style={inputStyle} value={createForm.endAt}
                    onChange={e => { setCreateForm(f => ({ ...f, endAt: e.target.value })); setCreateErrors(err => ({ ...err, endAt: undefined })); }}
                    disabled={createSubmitting} />
                  {createErrors.endAt && <div style={fieldErrorStyle}>{createErrors.endAt}</div>}
                </div>
              </div>
              <div style={formBtnRowStyle}>
                <button type="button" style={cancelBtnStyle} onClick={() => { setShowCreateForm(false); setCreateErrors({}); setCreateError(''); }} disabled={createSubmitting}>
                  Cancel
                </button>
                <button type="submit" style={{ ...saveBtnStyle, ...(createSubmitting ? disabledBtnStyle : {}) }} disabled={createSubmitting}>
                  {createSubmitting ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit event form */}
        {editingEvent && canManageEvents && (
          <div style={formBoxStyle}>
            <div style={{ fontWeight: 'bold', color: '#2d5016', marginBottom: '14px', fontSize: '1rem' }}>Edit Event</div>
            {editError && <div style={{ ...errorStyle, marginBottom: '12px' }}>{editError}</div>}
            <form onSubmit={handleEditSubmit} noValidate>
              <div style={fieldGroupStyle}>
                <label style={labelStyle} htmlFor="edit-title">Title <span style={{ color: '#b91c1c' }}>*</span></label>
                <input id="edit-title" type="text" style={inputStyle} value={editForm.title} maxLength={255}
                  onChange={e => { setEditForm(f => ({ ...f, title: e.target.value })); setEditErrors(err => ({ ...err, title: undefined })); }}
                  disabled={editSubmitting} />
                {editErrors.title && <div style={fieldErrorStyle}>{editErrors.title}</div>}
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle} htmlFor="edit-description">Description <span style={{ fontWeight: 'normal', color: '#6b7280' }}>(optional)</span></label>
                <textarea id="edit-description" style={textareaStyle} value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  disabled={editSubmitting} />
              </div>
              <div style={formRowStyle}>
                <div style={{ flex: 1, minWidth: '200px', ...fieldGroupStyle }}>
                  <label style={labelStyle} htmlFor="edit-startAt">Start Date &amp; Time <span style={{ color: '#b91c1c' }}>*</span></label>
                  <input id="edit-startAt" type="datetime-local" style={inputStyle} value={editForm.startAt}
                    onChange={e => { setEditForm(f => ({ ...f, startAt: e.target.value })); setEditErrors(err => ({ ...err, startAt: undefined })); }}
                    disabled={editSubmitting} />
                  {editErrors.startAt && <div style={fieldErrorStyle}>{editErrors.startAt}</div>}
                </div>
                <div style={{ flex: 1, minWidth: '200px', ...fieldGroupStyle }}>
                  <label style={labelStyle} htmlFor="edit-endAt">End Date &amp; Time <span style={{ fontWeight: 'normal', color: '#6b7280' }}>(optional)</span></label>
                  <input id="edit-endAt" type="datetime-local" style={inputStyle} value={editForm.endAt}
                    onChange={e => { setEditForm(f => ({ ...f, endAt: e.target.value })); setEditErrors(err => ({ ...err, endAt: undefined })); }}
                    disabled={editSubmitting} />
                  {editErrors.endAt && <div style={fieldErrorStyle}>{editErrors.endAt}</div>}
                </div>
              </div>
              <div style={formBtnRowStyle}>
                <button type="button" style={cancelBtnStyle} onClick={() => { setEditingEvent(null); setEditErrors({}); setEditError(''); }} disabled={editSubmitting}>
                  Cancel
                </button>
                <button type="submit" style={{ ...saveBtnStyle, ...(editSubmitting ? disabledBtnStyle : {}) }} disabled={editSubmitting}>
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Events list */}
        {eventsLoading ? (
          <p style={{ color: '#666', fontSize: '0.9rem' }}>Loading events...</p>
        ) : events.length === 0 ? (
          <div style={emptyStyle}>No events scheduled for this committee.</div>
        ) : (
          <div>
            {events.map(event => {
              const past = isPast(event.startAt);
              const isEditing = editingEvent?.id === event.id;
              return (
                <div key={event.id} style={isEditing ? { ...eventCardStyle, border: '1px solid #00693f' } : (past ? eventCardPastStyle : eventCardStyle)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', color: '#333', fontSize: '1rem', marginBottom: '3px' }}>
                        {event.title}
                        {past && <span style={pastBadgeStyle}>Past</span>}
                      </div>
                      <div style={{ fontSize: '0.88rem', color: '#2d5016', fontWeight: 'bold', marginBottom: '6px' }}>
                        {formatEventDate(event.startAt, event.endAt)}
                      </div>
                      {event.description && (
                        <div style={{ fontSize: '0.9rem', color: '#555', lineHeight: '1.5' }}>{event.description}</div>
                      )}
                    </div>
                    {canManageEvents && !showCreateForm && !editingEvent && (
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button style={editBtnStyle} onClick={() => handleEditOpen(event)}>Edit</button>
                        <button style={deleteBtnStyle} onClick={() => { setDeleteTarget(event); setDeleteError(''); }}>Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Members (shown only to admin and committee members) */}
      {canSeeMembers && (
        <div style={sectionStyle}>
          <div style={sectionHeadingRowStyle}>
            <div style={sectionHeadingStyle}>Members ({committee._count.members})</div>
          </div>
          {committee.members.length === 0 ? (
            <div style={emptyStyle}>No members assigned to this committee.</div>
          ) : (
            <div>
              {committee.members.map(member => (
                <div key={member.id} style={memberCardStyle}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#333' }}>{member.firstName} {member.lastName}</div>
                    <div style={{ fontSize: '0.85rem', color: '#777', marginTop: '2px' }}>Unit {member.unitNumber}</div>
                  </div>
                  {member.id === session?.user?.id && (
                    <span style={{ padding: '2px 8px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 'bold' }}>You</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
