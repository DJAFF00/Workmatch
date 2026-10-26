export const inputClass =
  "w-full rounded-2xl border border-line bg-white px-4 py-3 text-base font-medium outline-none transition placeholder:font-normal placeholder:text-muted/60 focus:border-orange focus:ring-4 focus:ring-orange/15";

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p role="alert" className="rounded-2xl bg-orange-soft px-4 py-3 text-sm font-semibold text-orange-deep">{message}</p>;
}
