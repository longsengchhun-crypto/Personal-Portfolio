"use client";

// A visitor's own browser print-to-PDF ("Save as PDF" in the print dialog) is enough here — no
// PDF-generation dependency needed just to hand someone a downloadable copy of their receipt.
export default function PrintReceiptButton() {
  return <button className="btn btn-accent receipt-print-button" type="button" onClick={() => window.print()}>
    <i className="bi bi-printer" /> Print / Save as PDF
  </button>;
}
