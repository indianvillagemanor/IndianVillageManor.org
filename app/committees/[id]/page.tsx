'use client';

import { useState, useEffect, useCallback } from 'react';
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

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 'bold',
  color: '#333',
  marginBottom: '12px',
  paddingBottom: '6px',
  borderBottom: '2px solid #e5e7eb',
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

export default function CommitteeDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const committeeId = params?.id as string;

  const [committee, setCommittee] = useState<CommitteeDetail | null>(null);
  const [viewerInfo, setViewerInfo] = useState<ViewerInfo>({ isAdmin: false, isPublisher: false, isMember: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCommittee = useCallback(async () => {
    if (!committeeId) return;
    try {
      const res = await fetch(`/api/committees/${committeeId}`);
      if (res.status === 401) {
        router.push('/auth/login');
        return;
      }
      if (res.status === 403 || res.status === 404) {
        router.push('/committees');
        return;
      }
      const data = await res.json();
      setCommittee(data.committee);
      setViewerInfo(data.viewerInfo);
    } catch {
      setError('Failed to load committee details');
    } finally {
      setLoading(false);
    }
  }, [committeeId, router]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated') {
      fetchCommittee();
    }
  }, [status, router, fetchCommittee]);

  if (status === 'loading' || loading) {
    return (
      <div style={pageStyle}>
        <p style={{ color: '#666' }}>Loading committee details...</p>
      </div>
    );
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
  const canManageDocs =
    viewerInfo.isAdmin ||
    (viewerInfo.isPublisher && viewerInfo.isMember);

  return (
    <div style={pageStyle}>
      <Link href="/committees" style={backLinkStyle}>
        &larr; Back to Committees
      </Link>

      <div style={headingRowStyle}>
        <h1 style={headingStyle}>{committee.name}</h1>
        <div style={adminActionsStyle}>
          {viewerInfo.isAdmin && (
            <Link href={`/admin/committees/${committee.id}`} style={manageLinkStyle}>
              Edit / Manage Members
            </Link>
          )}
          {canManageDocs && (
            <Link
              href={`/committees/${committee.id}/documents`}
              style={manageLinkStyle}
            >
              Manage Documents
            </Link>
          )}
          {!viewerInfo.isAdmin && viewerInfo.isMember && !canManageDocs && (
            <span style={{
              padding: '4px 10px',
              backgroundColor: '#dcfce7',
              color: '#166534',
              borderRadius: '4px',
              fontSize: '0.82rem',
              fontWeight: 'bold',
            }}>
              You are a member
            </span>
          )}
        </div>
      </div>

      {committee.description && (
        <p style={descStyle}>{committee.description}</p>
      )}

      {error && <div style={errorStyle}>{error}</div>}

      {/* Published Documents */}
      <div style={sectionStyle}>
        <div style={sectionHeadingStyle}>
          Published Documents ({committee.documents.length})
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
                    Uploaded {new Date(doc.uploadedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {doc.archived && (
                    <span style={badgeStyle}>Archived</span>
                  )}
                  <a
                    href={`/api/documents/${doc.id}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '6px 14px',
                      backgroundColor: '#2d5016',
                      color: '#fff',
                      borderRadius: '4px',
                      fontSize: '0.83rem',
                      fontWeight: 'bold',
                      textDecoration: 'none',
                    }}
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Members (shown only to admin and committee members) */}
      {canSeeMembers && (
        <div style={sectionStyle}>
          <div style={sectionHeadingStyle}>
            Members ({committee._count.members})
          </div>
          {committee.members.length === 0 ? (
            <div style={emptyStyle}>No members assigned to this committee.</div>
          ) : (
            <div>
              {committee.members.map(member => (
                <div key={member.id} style={memberCardStyle}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#333' }}>
                      {member.firstName} {member.lastName}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#777', marginTop: '2px' }}>
                      Unit {member.unitNumber}
                    </div>
                  </div>
                  {member.id === session?.user?.id && (
                    <span style={{
                      padding: '2px 8px',
                      backgroundColor: '#dcfce7',
                      color: '#166534',
                      borderRadius: '4px',
                      fontSize: '0.78rem',
                      fontWeight: 'bold',
                    }}>
                      You
                    </span>
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
