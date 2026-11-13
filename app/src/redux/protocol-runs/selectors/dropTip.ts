import type { State } from '../../types'

export const selectDropTipPromptDismissed =
  (runId: string) =>
  (state: State): boolean =>
    state.protocolRuns[runId]?.dropTipPromptDismissed ?? false
