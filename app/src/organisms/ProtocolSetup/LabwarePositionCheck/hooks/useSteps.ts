import { useSelector } from 'react-redux'
import { getProtocolData } from '../../../../redux/protocol'
import { getLabwarePositionCheckSteps } from '../getLabwarePositionCheckSteps'
import type { LabwarePositionCheckStep } from '../types'

export function useSteps(): LabwarePositionCheckStep[] {
  // @ts-expect-error casting to a v6 protocol, switch this to grab from react query once we make the switch
  const protocolData: ProtocolFile<{}> = useSelector((state: State) =>
    getProtocolData(state)
  )
  if (protocolData == null) return [] // this state should never be reached
  return getLabwarePositionCheckSteps(protocolData)
}
