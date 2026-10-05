import { Inbox } from "@/components/ui/Icon";

export default function MessagesIndexPage() {
  return <div className="inbox__placeholder"><Inbox aria-hidden="true" /><h2>Select a message</h2><p>Choose a conversation from the list to read it and reply.</p></div>;
}
