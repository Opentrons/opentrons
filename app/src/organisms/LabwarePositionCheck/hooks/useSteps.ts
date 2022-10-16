import * as React from 'react'

import { getLabwarePositionCheckSteps } from '../getLabwarePositionCheckSteps'
import type { LabwarePositionCheckStep } from '../types'
import { CompletedProtocolAnalysis } from '@opentrons/shared-data'

export function useSteps(
  protocolData: CompletedProtocolAnalysis | null
): LabwarePositionCheckStep[] {
  if (protocolData == null) return [] // this state should never be reached

  return getLabwarePositionCheckSteps(protocolData)
}
