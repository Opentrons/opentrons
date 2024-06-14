import * as React from 'react'

import {
  FLEX_ROBOT_TYPE,
  getSimplestDeckConfigForProtocol,
} from '@opentrons/shared-data'
import { BaseDeck } from '@opentrons/components'

import type { RecoveryContentProps } from '../types'

// TODO(jh, 06-13-24): EXEC-536.
export function RecoveryMap({
  isOnDevice,
  protocolAnalysis,
}: RecoveryContentProps): JSX.Element | null {
  const deckConfig = getSimplestDeckConfigForProtocol(protocolAnalysis)

  if (isOnDevice) {
    return <BaseDeck deckConfig={deckConfig} robotType={FLEX_ROBOT_TYPE} />
  } else {
    return null
  }
}
