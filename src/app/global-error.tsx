"use client";

// Catches crashes in the root layout / providers (above per-route error.tsx).
// Without this, such errors render a blank white page.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "3rem", maxWidth: 640, margin: "0 auto" }}>
        <p style={{ letterSpacing: ".12em", textTransform: "uppercase", fontSize: 12, color: "#a67c3d" }}>
          Something went wrong
        </p>
        <h1 style={{ fontSize: 28, margin: "0.4rem 0 1rem" }}>A thread came loose</h1>
        <p style={{ color: "#555" }}>The app hit an unexpected error while loading.</p>
        <pre
          style={{
            background: "#faf4ec",
            border: "1px solid #e8ddcb",
            borderRadius: 6,
            padding: "1rem",
            overflow: "auto",
            fontSize: 13,
            color: "#7a2e2e",
            whiteSpace: "pre-wrap",
          }}
        >
          {error?.message || String(error)}
          {error?.digest ? `\n\ndigest: ${error.digest}` : ""}
        </pre>
        <button
          onClick={reset}
          style={{
            marginTop: "1.2rem",
            padding: "0.7rem 1.4rem",
            background: "#231a12",
            color: "#fff",
            border: 0,
            borderRadius: 2,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
