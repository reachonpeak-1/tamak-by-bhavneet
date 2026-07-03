import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap page">
      <div className="empty">
        <span className="eyebrow">404</span>
        <h2>This page has wandered off the loom</h2>
        <p>The page you’re looking for doesn’t exist or has moved.</p>
        <Link className="btn btn--solid" href="/">Back to home</Link>
      </div>
    </main>
  );
}
