// Floating WhatsApp order button. Number from NEXT_PUBLIC_WHATSAPP (digits only,
// incl. country code, e.g. 919876543210). Hidden if not set.
const NUMBER = process.env.NEXT_PUBLIC_WHATSAPP;

export default function WhatsAppButton() {
  if (!NUMBER) return null;
  const href = `https://wa.me/${NUMBER}?text=${encodeURIComponent("Hi तमक! I'd like to know more about a piece.")}`;
  return (
    <a className="wa-fab" href={href} target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12.04 2a9.9 9.9 0 0 0-8.46 15l-1.1 4.02 4.12-1.08A9.9 9.9 0 1 0 12.04 2zm0 1.8a8.1 8.1 0 0 1 0 16.2 8.06 8.06 0 0 1-4.11-1.13l-.29-.17-2.44.64.65-2.38-.19-.3A8.1 8.1 0 0 1 12.04 3.8zm4.64 10.18c-.25-.13-1.47-.72-1.7-.8-.23-.09-.4-.13-.56.13-.17.25-.64.8-.79.97-.14.17-.29.19-.54.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.29.38-.43.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.43 1.03 2.6.13.17 1.77 2.7 4.3 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.16-.48-.29z" />
      </svg>
    </a>
  );
}
