import Link from "next/link";
import { Arrow } from "@/components/arrow";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
      <span className="grid size-8 place-items-center rounded-full bg-orange text-white"><Arrow className="size-4 -rotate-45" /></span>
      WorkMatch
    </Link>
  );
}
