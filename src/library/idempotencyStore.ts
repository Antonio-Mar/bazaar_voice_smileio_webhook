const processedEvents = new Set<string>();

export function hasProcessed(key: string): boolean {
  return processedEvents.has(key);
}

export function markProcessed(key: string): void {
  processedEvents.add(key);
}