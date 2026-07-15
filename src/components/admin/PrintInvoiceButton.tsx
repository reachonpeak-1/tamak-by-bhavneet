"use client";

/** Opens the browser print dialog — which also offers "Save as PDF". */
export default function PrintInvoiceButton() {
  return (
    <button type="button" className="adm-btn adm-btn--gold no-print" onClick={() => window.print()}>
      Print invoice
    </button>
  );
}
