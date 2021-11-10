import { useProtocolDetails } from '../../../RunDetails/hooks'
import { getLabwarePositionCheckSteps } from '../getLabwarePositionCheckSteps'
import type { LabwarePositionCheckStep } from '../types'

export function useSteps(): LabwarePositionCheckStep[] {
  const { protocolData } = useProtocolDetails()
  if (protocolData == null) return [] // this state should never be reached
  return getLabwarePositionCheckSteps(protocolData)
}
