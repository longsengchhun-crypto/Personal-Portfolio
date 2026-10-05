import { Inbox } from "@/components/ui/Icon";

export default function MessagesIndexPage() {
  return <div className="inbox__placeholder"><Inbox aria-hidden="true" /><h1>Select a message</h1><p>Choose a conversation from the list to read it and reply.</p></div>;
}
