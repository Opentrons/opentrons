import * as React from 'react'
import { useProtocolDetailsForRun } from '../../Devices/hooks/useProtocolDetailsForRun'
import { getLabwarePositionCheckSteps } from '../getLabwarePositionCheckSteps'
import type { DeprecatedLabwarePositionCheckStep } from '../types'

export function useDeprecatedSteps(runId: string | null): LabwarePositionCheckStep[] {
  const [LPCSteps, setLPCSteps] = React.useState<LabwarePositionCheckStep[]>([])
  const { protocolData } = useProtocolDetailsForRun(runId)
  if (protocolData == null) return [] // this state should never be reached
  if (LPCSteps.length === 0) {
    setLPCSteps(getLabwarePositionCheckSteps(protocolData))
  }
  return LPCSteps
}
