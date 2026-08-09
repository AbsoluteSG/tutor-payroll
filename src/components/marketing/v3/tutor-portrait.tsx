import Image from "next/image";

/**
 * A tutor's portrait, for the booking panel's tutor cards.
 *
 * There are no photographs yet. Rather than ship a grey avatar silhouette —
 * which reads as a missing image, not a person — an absent portrait is drawn as
 * a halftone plate in the /v3 print system: a dot field with the tutor's
 * monogram set in the editorial face over it. It looks deliberate at the size
 * the cards use it, and it is obviously not a photograph, so nobody mistakes a
 * placeholder roster for a real one.
 *
 * When real photographs arrive, give the tutor an `image` (a path under
 * /public) and this switches to it with no other change. Portraits should be
 * shot or cropped to 4:5 — the card reserves that box either way, so swapping a
 * placeholder for a photo never moves the layout.
 */

/** The box every portrait fills. Cards reserve it whether or not a photo exists. */
export const PORTRAIT_ASPECT = "4 / 5";

type Props = {
  /** Path under /public, e.g. "/tutors/maya-r.jpg". Omit for the placeholder. */
  image?: string;
  /** Two letters, for the placeholder monogram. */
  initials: string;
  /** Used for the photo's alt text. The placeholder is decorative. */
  name: string;
  className?: string;
};

/**
 * Small deterministic variation so a row of placeholders doesn't read as one
 * plate repeated: the dot grid and the monogram's offset shift per tutor. Summed
 * char codes are enough — this only has to differ, not to be uniform.
 */
function seedFrom(initials: string) {
  let n = 0;
  for (const ch of initials) n += ch.charCodeAt(0);
  return n;
}

export function TutorPortrait({ image, initials, name, className = "" }: Props) {
  if (image) {
    return (
      <div
        className={`relative overflow-hidden ${className}`}
        style={{ aspectRatio: PORTRAIT_ASPECT }}
      >
        <Image
          src={image}
          alt={`${name}, tutor`}
          fill
          // Four cards across a 64rem row on desktop, two across on a phone.
          sizes="(min-width: 1024px) 15rem, (min-width: 640px) 30vw, 45vw"
          className="object-cover"
        />
      </div>
    );
  }

  const seed = seedFrom(initials);
  // Coprime-ish steps keep neighbouring monograms from landing on the same grid
  // phase, which is what made three placeholders in a row look identical.
  const dotSize = 5 + (seed % 3);
  const offsetX = seed % 4;
  const offsetY = (seed >> 2) % 4;

  return (
    <div
      aria-hidden
      className={`relative overflow-hidden ${className}`}
      style={{
        aspectRatio: PORTRAIT_ASPECT,
        // A shade off the ground, matching every other well in the system.
        backgroundColor: "var(--v3-card)",
      }}
    >
      {/* Halftone ground. Masked to fade toward the top so the monogram sits in
          clear space rather than fighting the dots. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(var(--v3-ink) 1.15px, transparent 1.15px)`,
          backgroundSize: `${dotSize}px ${dotSize}px`,
          backgroundPosition: `${offsetX}px ${offsetY}px`,
          opacity: 0.28,
          maskImage: "linear-gradient(to top, #000 15%, transparent 85%)",
          WebkitMaskImage: "linear-gradient(to top, #000 15%, transparent 85%)",
        }}
      />

      {/* The monogram. Sized in cqw so it scales with the card rather than
          needing a breakpoint per column count. */}
      <div
        className="absolute inset-0 grid place-items-center"
        style={{ containerType: "inline-size" }}
      >
        <span
          className="font-[family-name:var(--font-editorial)] leading-none tracking-tight"
          style={{
            fontSize: "34cqw",
            color: "var(--v3-ink)",
            opacity: 0.72,
          }}
        >
          {initials}
        </span>
      </div>

      {/* Accent rule along the base — the same mark the selected plates carry,
          so a portrait reads as part of the set. */}
      <span
        className="absolute inset-x-0 bottom-0 h-[3px]"
        style={{ backgroundColor: "var(--v3-accent)", opacity: 0.55 }}
      />
    </div>
  );
}
