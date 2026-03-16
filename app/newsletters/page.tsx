import { prisma } from '@/lib/prisma';
import { ensurePdfThumbnail } from '@/lib/pdf-thumbnail';
import Image from 'next/image';

// This page reads from Prisma; force runtime rendering so Docker build does not
// require DATABASE_URL during static prerender.
export const dynamic = 'force-dynamic';

interface Newsletter {
  id: string;
  title: string;
  uploadedAt: Date;
  filename: string;
  thumbnailPath: string | null;
}

async function getPublishedNewsletters(): Promise<Newsletter[]> {
  const newsletters = await prisma.document.findMany({
    where: {
      isNewsletter: true,
      published: true,
      deleted: false,
    },
    orderBy: { uploadedAt: 'desc' },
    select: {
      id: true,
      title: true,
      uploadedAt: true,
      filename: true,
      thumbnailPath: true,
    },
  });

  return Promise.all(
    newsletters.map(async newsletter => {
      const thumbnailPath = await ensurePdfThumbnail(newsletter);

      if (thumbnailPath !== newsletter.thumbnailPath) {
        await prisma.document.update({
          where: { id: newsletter.id },
          data: { thumbnailPath },
        });
      }

      return {
        ...newsletter,
        thumbnailPath,
      };
    })
  );
}

// ---- Styles ----

const pageStyle: React.CSSProperties = {
  maxWidth: '960px',
  margin: '0 auto',
  padding: '40px 16px',
};

const headingStyle: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 'bold',
  color: '#2d5016',
  marginBottom: '8px',
};

const subheadingStyle: React.CSSProperties = {
  fontSize: '1rem',
  color: '#555',
  marginBottom: '36px',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  gap: '24px',
};

const cardStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: '10px',
  overflow: 'hidden',
  backgroundColor: '#fff',
  boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
  transition: 'box-shadow 0.2s',
  display: 'flex',
  flexDirection: 'column',
};

const thumbnailContainerStyle: React.CSSProperties = {
  width: '100%',
  aspectRatio: '8.5 / 11',
  backgroundColor: '#f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  position: 'relative',
};

const placeholderStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#9ca3af',
  fontSize: '0.85rem',
  gap: '8px',
};

const cardBodyStyle: React.CSSProperties = {
  padding: '14px 16px',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const cardTitleStyle: React.CSSProperties = {
  fontWeight: '600',
  fontSize: '0.97rem',
  color: '#1f2937',
  lineHeight: '1.4',
};

const cardDateStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  color: '#6b7280',
};

const linkStyle: React.CSSProperties = {
  textDecoration: 'none',
  color: 'inherit',
  display: 'block',
};

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '48px 16px',
  color: '#888',
  fontSize: '1rem',
};

// ---- Component ----

export default async function NewslettersPage() {
  const newsletters = await getPublishedNewsletters();

  return (
    <div style={pageStyle}>
      <h1 style={headingStyle}>Newsletters</h1>
      <p style={subheadingStyle}>
        Community newsletters from Indian Village Manor. Click any newsletter to open or download it.
      </p>

      {newsletters.length === 0 ? (
        <div style={emptyStyle}>No newsletters have been published yet.</div>
      ) : (
        <div style={gridStyle}>
          {newsletters.map(newsletter => (
            <a
              key={newsletter.id}
              href={`/api/documents/${newsletter.id}/download`}
              target="_blank"
              rel="noopener noreferrer"
              style={linkStyle}
              title={`Open ${newsletter.title}`}
            >
              <div style={cardStyle}>
                <div style={thumbnailContainerStyle}>
                  {newsletter.thumbnailPath ? (
                    <Image
                      src={`/api/newsletters/${newsletter.id}/thumbnail`}
                      alt={`First page of ${newsletter.title}`}
                      fill
                      style={{ objectFit: 'cover', objectPosition: 'top' }}
                      sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 33vw"
                    />
                  ) : (
                    <div style={placeholderStyle}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                      <span>PDF</span>
                    </div>
                  )}
                </div>
                <div style={cardBodyStyle}>
                  <div style={cardTitleStyle}>{newsletter.title}</div>
                  <div style={cardDateStyle}>
                    {new Date(newsletter.uploadedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
