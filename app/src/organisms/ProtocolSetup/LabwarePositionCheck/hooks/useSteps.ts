import * as React from 'react'
import { useProtocolDetails } from '../../../RunDetails/hooks'
import { getLabwarePositionCheckSteps } from '../getLabwarePositionCheckSteps'
import type { LabwarePositionCheckStep } from '../types'

export function useSteps(): LabwarePositionCheckStep[] {
  const [LPCSteps, setLPCSteps] = React.useState<LabwarePositionCheckStep[]>([])
  const { protocolData } = useProtocolDetails()
  if (protocolData == null) return [] // this state should never be reached
  if (LPCSteps.length === 0) {
    setLPCSteps(getLabwarePositionCheckSteps(protocolData))
  }
  return LPCSteps
}
