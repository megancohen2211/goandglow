"use server";

import { getSalonsByIds } from "@/lib/data/salons";

export async function fetchFavoriteSalons(ids: string[]) {
  return getSalonsByIds(ids);
}
