/**
 * Film grain — the printed texture the whole /v3 system sits under.
 *
 * Blend mode and strength come from the theme rather than this component:
 * grain is pressed *into* paper and reflects *off* ink, so it multiplies on the
 * light skin and screens on the dark one. See `.v3-grain` in globals.css.
 *
 * The filter needs an id unique to the document, so each page passes its own.
 * Keep this a sibling of the page content rather than nesting it inside a
 * positioned wrapper: `fixed` escapes the box, but z-index does not escape a
 * stacking context, so grain inside a `z-20` header would sit under the page.
 */
export function Grain({
  id,
  className = "fixed",
}: {
  id: string;
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      className={`v3-grain pointer-events-none ${className} inset-0 z-50 h-full w-full`}
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.82"
          numOctaves="3"
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}
