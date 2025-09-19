import type { State } from '../types'

export function getSystemLanguage(state: State): string | null {
  return state.shell.systemLanguage?.[0] ?? null
}
