export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Chargement" className="space-y-4">
      <div className="h-10 w-64 animate-pulse rounded-2xl bg-white/70" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="glass h-28 animate-pulse rounded-3xl" />)}
      </div>
    </div>
  );
}
