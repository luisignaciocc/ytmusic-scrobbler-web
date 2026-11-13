/**
 * Text that changes while the page stays open (a button label that becomes
 * "Saving…", a status, a counter).
 *
 * Browser page translation (Chrome translates this English site by default
 * for many visitors) replaces text nodes with its own elements. React then
 * holds references to nodes that are no longer in the page: updating one
 * silently does nothing, so the label never changes, and removing one throws
 * "Failed to execute 'removeChild' on 'Node'" and takes the page down.
 *
 * Rendering the text in its own element, keyed by the text, makes React swap
 * the whole element instead, which is safe and gets translated again.
 */
export default function DynamicText({ children }: { children: string }) {
  return <span key={children}>{children}</span>;
}
