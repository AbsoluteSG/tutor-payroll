/**
 * Shared sizing for the /v3 navigation bars.
 *
 * The three surfaces carry structurally different navs — the landing page has a
 * wordmark and links, the course gallery a segmented rail, a subject page a back
 * link and a plate label — and they should stay that way. What they should not
 * do is differ in *size*: the bar was 65px tall on the landing page and 59px on
 * the course pages, with link type at 10px on one and 24px on the other, so
 * moving between them nudged the whole page down and changed the reading size of
 * the navigation.
 *
 * The fix is an explicit height rather than one that falls out of padding.
 * Padding-derived heights drift the moment the type scale moves — which is
 * exactly what happened here — whereas a fixed bar keeps every surface aligned
 * no matter what is inside it.
 */

/** The bar itself: height, hairline, and horizontal inset. */
export const NAV_BAR =
  "flex h-[3.75rem] shrink-0 items-center justify-between border-b border-current/12 px-4 sm:px-6";

/** Anything a visitor reads or clicks in the bar. */
export const NAV_ITEM = "v3-label font-mono uppercase";

/**
 * The wordmark, where a surface shows one. Sized to sit on the same baseline as
 * NAV_ITEM rather than to match it — this is display type, not a label.
 */
export const NAV_WORDMARK =
  "font-[family-name:var(--font-editorial)] text-[1.75rem] leading-none tracking-[0.035em] whitespace-nowrap";
