import type { LPCUiState } from '/app/redux/protocol-runs/types/lpc/ui'
import type { State } from '/app/redux/types'
import { createSelector } from 'reselect'
import type { Selector } from 'reselect'

export const selectShowDefaultOffsetInfoBanner = (
  runId: string
): Selector<State, LPCUiState['showDefaultOffsetInfoBanner']> =>
  createSelector(
    (state: State) =>
      state.protocolRuns[runId]?.lpc?.ui.showDefaultOffsetInfoBanner,
    showBanner => showBanner ?? true
  )
