'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface CommitteeMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  unitNumber: string;
  verificationStatus: string;
}

interface CommitteeDocument {
  id: string;
  title: string;
  published: boolean;
  archived: boolean;
  uploadedAt: string;
}

interface CommitteeDetail {
  id: string;
  name: string;
  description: string | null;
  hasNewsletterFeature: boolean;
  members: CommitteeMember[];
  documents: CommitteeDocument[];
}

interface VerifiedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  unitNumber: string;
}

// ---- Styles ----

const pageStyle: React.CSSProperties = {
  maxWidth: '860px',
  margin: '0 auto',
  padding: '24px 16px',
};

const headingStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: '#2d5016',
  margin: '0 0 6px 0',
};

const subheadingStyle: React.CSSProperties = {
  color: '#555',
  fontSize: '0.95rem',
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

const sectionStyle: React.CSSProperties = {
  marginBottom: '32px',
};

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: '1.05rem',
  fontWeight: 'bold',
  color: '#333',
  marginBottom: '12px',
  paddingBottom: '6px',
  borderBottom: '2px solid #e5e7eb',
};

const fieldGroupStyle: React.CSSProperties = {
  marginBottom: '16px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontWeight: 'bold',
  color: '#333',
  marginBottom: '6px',
  fontSize: '0.95rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '0.95rem',
  fontFamily: 'inherit',
  boxSizing: 'border-box' as const,
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: '80px',
  resize: 'vertical' as const,
};

const buttonRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
  marginTop: '8px',
};

const saveButtonStyle: React.CSSProperties = {
  padding: '10px 24px',
  backgroundColor: '#2d5016',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '0.95rem',
};

const cancelLinkStyle: React.CSSProperties = {
  padding: '10px 20px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  color: '#555',
  textDecoration: 'none',
  fontWeight: '500',
  fontSize: '0.95rem',
  display: 'inline-block',
};

const deleteButtonStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#b91c1c',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '0.95rem',
  marginLeft: 'auto',
};

const disabledButtonStyle: React.CSSProperties = {
  opacity: 0.6,
  cursor: 'not-allowed',
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

const removeButtonStyle: React.CSSProperties = {
  padding: '4px 12px',
  backgroundColor: '#b91c1c',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.82rem',
  fontWeight: 'bold',
};

const addMemberRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  alignItems: 'center',
};

const selectStyle: React.CSSProperties = {
  flex: '1',
  minWidth: '220px',
  padding: '9px 10px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '0.95rem',
  fontFamily: 'inherit',
};

const addMemberButtonStyle: React.CSSProperties = {
  padding: '9px 18px',
  backgroundColor: '#2d5016',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '0.9rem',
  whiteSpace: 'nowrap' as const,
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
  textAlign: 'center',
  padding: '18px 16px',
  color: '#888',
  fontSize: '0.92rem',
  fontStyle: 'italic',
};

// ---- Component ----

export default function AdminCommitteePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id as string;
  const isNew = rawId === 'new';
  const committeeId = isNew ? null : rawId;

  const [committee, setCommittee] = useState<CommitteeDetail | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [hasNewsletterFeature, setHasNewsletterFeature] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [memberAction, setMemberAction] = useState<string | null>(null);
  const [allVerifiedUsers, setAllVerifiedUsers] = useState<VerifiedUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(!isNew);

  const fetchCommittee = useCallback(async () => {
    if (!committeeId) return;
    try {
      const res = await fetch(`/api/admin/committees/${committeeId}`);
      if (res.status === 401) { router.push('/auth/login'); return; }
      if (res.status === 403) { router.push('/'); return; }
      if (res.status === 404) { router.push('/committees'); return; }
      const data = await res.json();
      setCommittee(data.committee);
      setName(data.committee.name);
      setDescription(data.committee.description || '');
      setHasNewsletterFeature(data.committee.hasNewsletterFeature || false);
    } catch {
      setError('Failed to load committee');
    } finally {
      setLoading(false);
    }
  }, [committeeId, router]);

  const fetchVerifiedUsers = useCallback(async () => {
    try {
      // We'll hit verify route for authenticated admin to get user list
      // Using a dedicated endpoint not yet created - we'll fetch from admin/verify style
      // For now, use a users search approach via the existing verify route data
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setAllVerifiedUsers(data.users || []);
      }
    } catch {
      // Non-critical; just won't populate dropdown
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated') {
      if (!session?.user?.roles?.includes('dbadmin')) {
        router.push('/');
        return;
      }
      if (committeeId) {
        fetchCommittee();
      } else {
        setLoading(false);
      }
      fetchVerifiedUsers();
    }
  }, [status, session, router, committeeId, fetchCommittee, fetchVerifiedUsers]);

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Committee name is required');
      return;
    }

    setSaving(true);
    try {
      const url = isNew ? '/api/admin/committees' : `/api/admin/committees/${committeeId}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null, hasNewsletterFeature }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to save committee');
        return;
      }

      if (isNew) {
        setSuccess('Committee created successfully!');
        router.push(`/admin/committees/${data.committee.id}`);
      } else {
        setCommittee(prev => prev ? { ...prev, name: data.committee.name, description: data.committee.description, hasNewsletterFeature: data.committee.hasNewsletterFeature } : prev);
        setSuccess('Committee updated successfully!');
      }
    } catch {
      setError('Failed to save committee. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!committeeId) return;
    if (!confirm(`Are you sure you want to delete "${committee?.name}"? This action cannot be undone.`)) return;

    setDeleting(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/committees/${committeeId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to delete committee');
        return;
      }
      router.push('/committees');
    } catch {
      setError('Failed to delete committee. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId || !committeeId) return;
    setMemberAction('adding');
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/admin/committees/${committeeId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to add member');
        return;
      }
      setSuccess('Member added successfully.');
      setSelectedUserId('');
      await fetchCommittee();
    } catch {
      setError('Failed to add member.');
    } finally {
      setMemberAction(null);
    }
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!committeeId) return;
    if (!confirm(`Remove ${memberName} from this committee?`)) return;
    setMemberAction(userId);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/admin/committees/${committeeId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to remove member');
        return;
      }
      setSuccess(`${memberName} removed from committee.`);
      await fetchCommittee();
    } catch {
      setError('Failed to remove member.');
    } finally {
      setMemberAction(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div style={pageStyle}>
        <p style={{ color: '#666' }}>Loading...</p>
      </div>
    );
  }

  // Users not already members (for add dropdown)
  const memberIds = new Set((committee?.members || []).map(m => m.id));
  const availableUsers = allVerifiedUsers.filter(u => !memberIds.has(u.id));
  const hasDocuments = (committee?.documents || []).length > 0;

  return (
    <div style={pageStyle}>
      <Link href="/committees" style={backLinkStyle}>
        &larr; Back to Committees
      </Link>

      <h1 style={headingStyle}>
        {isNew ? 'Create Committee' : `Edit: ${committee?.name || ''}`}
      </h1>
      <p style={subheadingStyle}>
        {isNew ? 'Create a new community committee.' : 'Update committee details and manage members.'}
      </p>

      {error && <div style={errorStyle}>{error}</div>}
      {success && <div style={successStyle}>{success}</div>}

      {/* Committee Name & Description */}
      <div style={sectionStyle}>
        <div style={sectionHeadingStyle}>Committee Details</div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle} htmlFor="committee-name">
            Name <span style={{ color: '#b91c1c' }}>*</span>
          </label>
          <input
            id="committee-name"
            type="text"
            style={inputStyle}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g., Landscaping Committee"
            maxLength={120}
            disabled={saving}
          />
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle} htmlFor="committee-desc">
            Description
          </label>
          <textarea
            id="committee-desc"
            style={textareaStyle}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Brief description of the committee's purpose..."
            maxLength={500}
            disabled={saving}
          />
        </div>

        <div style={{ ...fieldGroupStyle, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            id="has-newsletter-feature"
            type="checkbox"
            checked={hasNewsletterFeature}
            onChange={e => setHasNewsletterFeature(e.target.checked)}
            disabled={saving}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <label htmlFor="has-newsletter-feature" style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer' }}>
            Newsletter Committee — members can mark PDF documents as newsletters
          </label>
        </div>

        <div style={buttonRowStyle}>
          <button
            style={{ ...saveButtonStyle, ...(saving ? disabledButtonStyle : {}) }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : isNew ? 'Create Committee' : 'Save Changes'}
          </button>
          <Link href="/committees" style={cancelLinkStyle}>
            Cancel
          </Link>
          {!isNew && (
            <button
              style={{
                ...deleteButtonStyle,
                ...(hasDocuments || deleting ? disabledButtonStyle : {}),
              }}
              onClick={handleDelete}
              disabled={hasDocuments || deleting}
              title={hasDocuments ? 'Cannot delete committee with documents' : 'Delete this committee'}
            >
              {deleting ? 'Deleting...' : 'Delete Committee'}
            </button>
          )}
        </div>
        {!isNew && hasDocuments && (
          <p style={{ fontSize: '0.82rem', color: '#777', marginTop: '6px' }}>
            Delete is disabled because this committee has documents. Remove all documents first.
          </p>
        )}
      </div>

      {/* Member Management - only for existing committees */}
      {!isNew && committee && (
        <div style={sectionStyle}>
          <div style={sectionHeadingStyle}>
            Members ({committee.members.length})
          </div>

          {/* Add member */}
          {availableUsers.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ ...labelStyle, marginBottom: '8px' }}>Add Member</label>
              <div style={addMemberRowStyle}>
                <select
                  style={selectStyle}
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  disabled={memberAction === 'adding'}
                >
                  <option value="">-- Select a verified user --</option>
                  {availableUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} (Unit {u.unitNumber}) - {u.email}
                    </option>
                  ))}
                </select>
                <button
                  style={{
                    ...addMemberButtonStyle,
                    ...((!selectedUserId || memberAction === 'adding') ? disabledButtonStyle : {}),
                  }}
                  onClick={handleAddMember}
                  disabled={!selectedUserId || memberAction === 'adding'}
                >
                  {memberAction === 'adding' ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </div>
          )}

          {/* Member list */}
          {committee.members.length === 0 ? (
            <div style={emptyStyle}>No members assigned to this committee yet.</div>
          ) : (
            <div>
              {committee.members.map(member => (
                <div key={member.id} style={memberCardStyle}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#333', fontSize: '0.98rem' }}>
                      {member.firstName} {member.lastName}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#777', marginTop: '2px' }}>
                      Unit {member.unitNumber} &bull; {member.email}
                    </div>
                  </div>
                  <button
                    style={{
                      ...removeButtonStyle,
                      ...(memberAction === member.id ? disabledButtonStyle : {}),
                    }}
                    onClick={() => handleRemoveMember(member.id, `${member.firstName} ${member.lastName}`)}
                    disabled={memberAction === member.id}
                  >
                    {memberAction === member.id ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Documents overview - read only in this view */}
      {!isNew && committee && committee.documents.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionHeadingStyle}>
            Documents ({committee.documents.length})
          </div>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '12px' }}>
            Document management will be available in a future milestone.
          </p>
          {committee.documents.map(doc => (
            <div key={doc.id} style={{
              border: '1px solid #ddd',
              borderRadius: '6px',
              padding: '10px 14px',
              marginBottom: '8px',
              backgroundColor: '#f9fafb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontWeight: '500', color: '#333', fontSize: '0.95rem' }}>{doc.title}</div>
                <div style={{ fontSize: '0.82rem', color: '#888', marginTop: '2px' }}>
                  {new Date(doc.uploadedAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {doc.published && (
                  <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 'bold', backgroundColor: '#dcfce7', color: '#166534' }}>
                    Published
                  </span>
                )}
                {doc.archived && (
                  <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 'bold', backgroundColor: '#fef9c3', color: '#854d0e' }}>
                    Archived
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
