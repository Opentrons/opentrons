import { createAction } from '@reduxjs/toolkit'

export const setDropTipPromptDismissed = createAction(
  'protocolRuns/setDropTipPromptDismissed',
  (runId: string) => ({
    payload: { runId },
  })
)
