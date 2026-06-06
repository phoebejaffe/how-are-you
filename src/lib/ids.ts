export function createId(): string {
  return crypto.randomUUID();
}

export function personNameKey(displayName: string): string {
  return displayName.trim();
}

export function nowIso(): string {
  return new Date().toISOString();
}
