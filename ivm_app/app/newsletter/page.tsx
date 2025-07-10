import Link from "next/link";

const newsletters = [
  {
    file: "IVM Newsletter 2024 November.pdf",
    label: "November 2024 Newsletter"
  },
  {
    file: "IVM Newsletter 2025 February.pdf",
    label: "February 2025 Newsletter"
  },
  {
    file: "IVM Newsletter 2025 May.pdf",
    label: "May 2025 Newsletter"
  }
];

export default function NewsletterPage() {
  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700 }}>Newsletters</h1>
      <ul style={{ fontSize: 20, lineHeight: 2 }}>
        {newsletters.map(nl => (
          <li key={nl.file}>
            <Link href={`/newsletters/${encodeURIComponent(nl.file)}`} target="_blank" rel="noopener noreferrer">
              {nl.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
