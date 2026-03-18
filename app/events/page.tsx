'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface EventItem {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  createdAt: string;
  committeeId: string;
  committeeName: string;
}

// --- Styles ---

const pageStyle: React.CSSProperties = {
  maxWidth: '900px',
  margin: '0 auto',
  padding: '24px 16px',
};

const topBarStyle: React.CSSProperties = {
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

const subtitleStyle: React.CSSProperties = {
  color: '#666',
  marginBottom: '20px',
  fontSize: '0.95rem',
};

const infoBoxStyle: React.CSSProperties = {
  padding: '12px 16px',
  backgroundColor: '#eff6ff',
  color: '#1e40af',
  border: '1px solid #bfdbfe',
  borderRadius: '8px',
  marginBottom: '20px',
  fontSize: '0.9rem',
};

const monthDividerStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 'bold',
  color: '#2d5016',
  backgroundColor: '#f0f7ec',
  padding: '8px 14px',
  borderRadius: '6px',
  marginBottom: '10px',
  marginTop: '20px',
  borderLeft: '4px solid #00693f',
};

const cardStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '18px 20px',
  marginBottom: '12px',
  backgroundColor: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
};

const cardPastStyle: React.CSSProperties = {
  ...cardStyle,
  opacity: 0.65,
  backgroundColor: '#f9f9f9',
};

const eventTitleStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 'bold',
  color: '#333',
  marginBottom: '4px',
};

const eventDateStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  color: '#2d5016',
  fontWeight: 'bold',
  marginBottom: '8px',
};

const eventDescStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  color: '#555',
  lineHeight: '1.5',
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

const committeeLinkStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  color: '#00693f',
  fontWeight: 'bold',
  textDecoration: 'none',
  marginTop: '6px',
  display: 'inline-block',
};

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '48px 16px',
  color: '#666',
  fontSize: '1.1rem',
};

// --- Helpers ---

function formatEventDate(startAt: string, endAt: string | null): string {
  const start = new Date(startAt);
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  };

  let result = start.toLocaleDateString('en-US', dateOptions);
  result += ' at ' + start.toLocaleTimeString('en-US', timeOptions);

  if (endAt) {
    const end = new Date(endAt);
    const sameDay = start.toDateString() === end.toDateString();
    if (sameDay) {
      result += ' – ' + end.toLocaleTimeString('en-US', timeOptions);
    } else {
      result += ' – ' + end.toLocaleDateString('en-US', dateOptions) + ' at ' + end.toLocaleTimeString('en-US', timeOptions);
    }
  }

  return result;
}

function getMonthYear(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function isPast(startAt: string): boolean {
  return new Date(startAt) < new Date();
}

function groupByMonth(events: EventItem[]): { label: string; events: EventItem[] }[] {
  const groups: { label: string; events: EventItem[] }[] = [];
  let currentLabel = '';
  let currentGroup: EventItem[] = [];

  for (const ev of events) {
    const label = getMonthYear(ev.startAt);
    if (label !== currentLabel) {
      if (currentGroup.length > 0) {
        groups.push({ label: currentLabel, events: currentGroup });
      }
      currentLabel = label;
      currentGroup = [ev];
    } else {
      currentGroup.push(ev);
    }
  }

  if (currentGroup.length > 0) {
    groups.push({ label: currentLabel, events: currentGroup });
  }

  return groups;
}

// --- Component ---

export default function EventsPage() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data.events) {
        setEvents(data.events);
        setIsVerified(data.isVerified);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status !== 'loading') {
      fetchEvents();
    }
  }, [status, fetchEvents]);

  if (status === 'loading' || loading) {
    return (
      <div style={pageStyle}>
        <h1 style={headingStyle}>Community Calendar</h1>
        <p style={{ color: '#666' }}>Loading events...</p>
      </div>
    );
  }

  const groups = groupByMonth(events);

  return (
    <div style={pageStyle}>
      {/* Page header */}
      <div style={topBarStyle}>
        <h1 style={headingStyle}>Community Calendar</h1>
      </div>

      <p style={subtitleStyle}>
        {isVerified
          ? 'All community events, past and upcoming.'
          : 'Upcoming community events. Sign in to view past events.'}
      </p>

      {!session && (
        <div style={infoBoxStyle}>
          Past events are only visible to verified community members.
          Please{' '}
          <Link href="/auth/login" style={{ color: '#1e40af', fontWeight: 'bold' }}>
            sign in
          </Link>{' '}
          to view the full event history.
        </div>
      )}

      {events.length === 0 ? (
        <div style={emptyStyle}>
          <p>No events to display at this time.</p>
        </div>
      ) : (
        <div>
          {groups.map(group => (
            <div key={group.label}>
              <div style={monthDividerStyle}>{group.label}</div>
              {group.events.map(event => {
                const past = isPast(event.startAt);
                return (
                  <div key={event.id} style={past ? cardPastStyle : cardStyle}>
                    <div style={eventTitleStyle}>
                      {event.title}
                      {past && <span style={pastBadgeStyle}>Past</span>}
                    </div>
                    <div style={eventDateStyle}>
                      {formatEventDate(event.startAt, event.endAt)}
                    </div>
                    {event.description && (
                      <div style={eventDescStyle}>{event.description}</div>
                    )}
                    <Link
                      href={`/committees/${event.committeeId}`}
                      style={committeeLinkStyle}
                    >
                      {event.committeeName} Committee
                    </Link>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
