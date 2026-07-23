/** Generic loading skeleton shown during route transitions. */
export function PageSkeleton() {
  return (
    <div className="grid animate-pulse gap-6" aria-busy>
      <div className="h-8 w-44 rounded-md bg-muted" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-muted" />
        ))}
      </div>
      <div className="h-72 rounded-lg bg-muted" />
    </div>
  );
}
