import { requireManager } from "@/lib/auth";
import { ChatConsole } from "./console";

/**
 * The live chat console.
 *
 * Everything real happens in the client component: this page exists to gate on
 * the manager role before any of it renders.
 *
 * Note what having this page open *means* — while it is open you are advertised
 * as available on the public site, and visitors are offered a live chat instead
 * of being asked to leave a message. Closing the tab takes the offer away
 * within about a minute.
 */
export default async function AdminChatPage() {
  await requireManager();
  return <ChatConsole />;
}
