// lib/progress-store.ts - Centralized progress management
const progressStore = new Map<string, number>()

export function updateProgress(sessionId: string, progress: number) {
  progressStore.set(sessionId, progress)
}

export function getProgress(sessionId: string): number {
  return progressStore.get(sessionId) || 0
}

export function deleteProgress(sessionId: string) {
  progressStore.delete(sessionId)
}
