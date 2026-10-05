import Link from "next/link";
import { Inbox } from "@/components/ui/Icon";

export default function MessageNotFound() {
  return <div className="inbox__placeholder"><Inbox aria-hidden="true" /><h2>That message doesn&apos;t exist</h2><p>It may have been removed. Pick another from the list.</p><Link className="btn btn--glass" href="/dashboard/messages/">Back to messages</Link></div>;
}
