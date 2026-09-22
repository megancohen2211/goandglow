"use client";

import { useRouter } from "next/navigation";

interface SalonSwitcherProps {
  salons: { id: string; name: string }[];
  currentId: string;
}

export function SalonSwitcher({ salons, currentId }: SalonSwitcherProps) {
  const router = useRouter();

  return (
    <select
      defaultValue={currentId}
      onChange={(e) => router.push(`/pro/tableau-de-bord/agenda?salon=${e.target.value}`)}
      className="rounded-lg border border-line px-3 py-2 text-sm"
    >
      {salons.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
