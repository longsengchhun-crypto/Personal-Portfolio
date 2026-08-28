"use client";

import { useState } from "react";
import StoreUploader from "@/components/StoreUploader";
import { mediaUrl } from "@/lib/supabase";

export default function PaymentSettingsForm({ currentQrImage, currentAccountInfo }: { currentQrImage: string; currentAccountInfo: string }) {
  const [qrImage, setQrImage] = useState(currentQrImage);

  return <form method="post" action="/api/dashboard/content/payment-settings/" className="inquiry-form">
    <div className="form-grid">
      <div className="form-field wide">
        <label>ABA QR code image</label>
        {qrImage && <img src={mediaUrl(qrImage, { width: 260 })} alt="Current ABA QR" style={{ maxWidth: 200, marginBottom: 12, display: "block", border: "1px solid var(--border)" }} />}
        <input type="hidden" name="aba_qr_image" value={qrImage} />
        <StoreUploader mode="media" kind="image" accept="image/jpeg,image/png,image/webp" label="Drop your ABA QR screenshot" onUploaded={(r) => setQrImage(r.path)} />
      </div>
      <div className="form-field wide">
        <label htmlFor="aba_account_info">Account info shown at checkout</label>
        <textarea id="aba_account_info" name="aba_account_info" className="form-control" rows={3} defaultValue={currentAccountInfo} placeholder={"KHR account: 009 959 066\nUSD account: 009 959 065"} />
      </div>
      <div className="form-field wide"><button className="btn btn-accent" type="submit">Save Payment Settings</button></div>
    </div>
  </form>;
}
