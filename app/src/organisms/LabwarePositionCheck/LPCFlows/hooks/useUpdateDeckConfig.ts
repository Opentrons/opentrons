import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { updateLPCDeck } from '/app/redux/protocol-runs'

import type { DeckConfiguration } from '@opentrons/shared-data'

// The deck config may change after LPC state initialization, and LPC needs to account
// for those changes.
export function useUpdateDeckConfig(
  isFlex: boolean,
  runId: string | null,
  deckConfig: DeckConfiguration | undefined
): void {
  const dispatch = useDispatch()

  useEffect(
    () => {
      if (runId != null && deckConfig != null && isFlex) {
        dispatch(updateLPCDeck(runId, deckConfig))
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deckConfig, runId, isFlex]
  )
}
