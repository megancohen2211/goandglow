const KEY = "goandglow-favorites";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // stockage indisponible (navigation privée...) : on ignore silencieusement
  }
}

export function getFavoriteIds(): string[] {
  return read();
}

export function isFavorite(salonId: string): boolean {
  return read().includes(salonId);
}

export function toggleFavorite(salonId: string): boolean {
  const ids = read();
  const idx = ids.indexOf(salonId);
  if (idx === -1) {
    ids.push(salonId);
    write(ids);
    return true;
  }
  ids.splice(idx, 1);
  write(ids);
  return false;
}
