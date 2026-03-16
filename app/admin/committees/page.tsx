'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CommitteeItem {
  id: string;
  name: string;
  description: string | null;
  hasNewsletterFeature: boolean;
  memberCount: number;
  documentCount: number;
}

const pageStyle: React.CSSProperties = {
  maxWidth: '900px',
  margin: '0 auto',
  padding: '24px 16px',
};

const backLinkStyle: React.CSSProperties = {
  display: 'inline-block',
  marginBottom: '16px',
  color: '#2d5016',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontWeight: '500',
};

const headingRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
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

const subheadingStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  color: '#555',
  marginBottom: '24px',
};

const createButtonStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#2d5016',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '0.95rem',
  textDecoration: 'none',
  display: 'inline-block',
};

const cardStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '16px',
  backgroundColor: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '8px',
};

const cardNameStyle: React.CSSProperties = {
  fontSize: '1.15rem',
  fontWeight: 'bold',
  color: '#2d5016',
};

const cardDescStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  color: '#555',
  marginBottom: '12px',
  lineHeight: '1.5',
};

const badgeRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
  alignItems: 'center',
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '3px 10px',
  borderRadius: '12px',
  fontSize: '0.82rem',
  fontWeight: '600',
};

const memberBadgeStyle: React.CSSProperties = {
  ...badgeStyle,
  backgroundColor: '#dbeafe',
  color: '#1e40af',
};

const docBadgeStyle: React.CSSProperties = {
  ...badgeStyle,
  backgroundColor: '#dcfce7',
  color: '#166534',
};

const newsletterBadgeStyle: React.CSSProperties = {
  ...badgeStyle,
  backgroundColor: '#fef3c7',
  color: '#92400e',
};

const manageLinkStyle: React.CSSProperties = {
  padding: '6px 16px',
  border: '1px solid #2d5016',
  borderRadius: '4px',
  color: '#2d5016',
  fontSize: '0.85rem',
  fontWeight: 'bold',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '48px 16px',
  color: '#666',
  fontSize: '1.1rem',
};

const errorStyle: React.CSSProperties = {
  padding: '16px',
  backgroundColor: '#fef2f2',
  color: '#b91c1c',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  marginBottom: '16px',
};

export default function AdminCommitteesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [committees, setCommittees] = useState<CommitteeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCommittees = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/committees');
      if (res.status === 401) { router.push('/auth/login'); return; }
      if (res.status === 403) { router.push('/'); return; }
      const data = await res.json();
      if (data.committees) {
        setCommittees(data.committees);
      }
    } catch {
      setError('Failed to load committees');
    } finally {
      setLoading(false);
    }
  }, [router]);

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
      fetchCommittees();
    }
  }, [status, session, router, fetchCommittees]);

  if (status === 'loading' || loading) {
    return (
      <div style={pageStyle}>
        <p style={{ color: '#666' }}>Loading...</p>
      </div>
    );
  }

  if (status === 'authenticated' && !session?.user?.roles?.includes('dbadmin')) {
    return (
      <div style={pageStyle}>
        <div style={{
          padding: '20px',
          backgroundColor: '#fef2f2',
          color: '#b91c1c',
          border: '1px solid #fecaca',
          borderRadius: '8px',
        }}>
          Access denied. This section requires the dbadmin role.
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <Link href="/admin/console" style={backLinkStyle}>
        &larr; Back to Admin Console
      </Link>

      <div style={headingRowStyle}>
        <h1 style={headingStyle}>Committee Management</h1>
        <Link href="/admin/committees/new" style={createButtonStyle}>
          + Create Committee
        </Link>
      </div>
      <p style={subheadingStyle}>
        Create, edit, and manage community committees and their members.
      </p>

      {error && <div style={errorStyle}>{error}</div>}

      {committees.length === 0 ? (
        <div style={emptyStyle}>
          <p>No committees found.</p>
          <p style={{ fontSize: '0.95rem', marginTop: '8px' }}>
            Get started by creating your first committee.
          </p>
        </div>
      ) : (
        <div>
          <p style={{ color: '#555', marginBottom: '16px', fontSize: '0.95rem' }}>
            {committees.length} committee{committees.length !== 1 ? 's' : ''}
          </p>
          {committees.map(committee => (
            <div key={committee.id} style={cardStyle}>
              <div style={cardHeaderStyle}>
                <div style={cardNameStyle}>{committee.name}</div>
                <Link
                  href={`/admin/committees/${committee.id}`}
                  style={manageLinkStyle}
                >
                  Manage
                </Link>
              </div>

              {committee.description && (
                <div style={cardDescStyle}>{committee.description}</div>
              )}

              <div style={badgeRowStyle}>
                <span style={memberBadgeStyle}>
                  {committee.memberCount} member{committee.memberCount !== 1 ? 's' : ''}
                </span>
                <span style={docBadgeStyle}>
                  {committee.documentCount} document{committee.documentCount !== 1 ? 's' : ''}
                </span>
                {committee.hasNewsletterFeature && (
                  <span style={newsletterBadgeStyle}>
                    📰 Newsletter
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
