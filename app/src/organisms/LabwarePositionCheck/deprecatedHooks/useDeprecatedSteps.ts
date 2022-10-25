import * as React from 'react'
import { useProtocolDetailsForRun } from '../../Devices/hooks/useProtocolDetailsForRun'
import { deprecatedGetLabwarePositionCheckSteps } from '../deprecatedUtils/deprecatedGetLabwarePositionCheckSteps'
import type { DeprecatedLabwarePositionCheckStep } from '../types'

export function useDeprecatedSteps(
  runId: string | null
): DeprecatedLabwarePositionCheckStep[] {
  const [LPCSteps, setLPCSteps] = React.useState<
    DeprecatedLabwarePositionCheckStep[]
  >([])
  const { protocolData } = useProtocolDetailsForRun(runId)
  if (protocolData == null) return [] // this state should never be reached
  if (LPCSteps.length === 0) {
    setLPCSteps(deprecatedGetLabwarePositionCheckSteps(protocolData))
  }
  return LPCSteps
}
