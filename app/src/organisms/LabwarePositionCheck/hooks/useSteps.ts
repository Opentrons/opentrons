import * as React from 'react'

import { getLabwarePositionCheckSteps } from '../getLabwarePositionCheckSteps'
import type { LabwarePositionCheckStep } from '../types'
import { CompletedProtocolAnalysis } from '@opentrons/shared-data'

export function useSteps(
  protocolData: CompletedProtocolAnalysis | null
): LabwarePositionCheckStep[] {
  const [LPCSteps, setLPCSteps] = React.useState<LabwarePositionCheckStep[]>([])
  if (protocolData == null) return [] // this state should never be reached
  if (LPCSteps.length === 0) {
    setLPCSteps(getLabwarePositionCheckSteps(protocolData))
  }
  return LPCSteps
}
