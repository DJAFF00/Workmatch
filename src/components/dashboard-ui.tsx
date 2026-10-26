import Link from "next/link";
import { Arrow } from "@/components/arrow";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: { href: string; label: string } }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {action && (
        <Link href={action.href} className="flex items-center gap-2 rounded-full bg-orange px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-8px_rgba(255,90,15,.6)] hover:bg-orange-deep">
          {action.label} <Arrow />
        </Link>
      )}
    </div>
  );
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="glass mt-8 rounded-[2rem] p-10 text-center">
      <p className="text-xl font-extrabold">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-muted">{text}</p>
    </div>
  );
}
