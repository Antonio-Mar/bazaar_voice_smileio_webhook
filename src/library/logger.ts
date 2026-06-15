export function logEvent(message: string, data?: any) {
  console.log(`[EVENT] ${message}`, data ?? "");
}

export function logError(message: string, error?: any) {
  console.error(`[ERROR] ${message}`, error ?? "");
}