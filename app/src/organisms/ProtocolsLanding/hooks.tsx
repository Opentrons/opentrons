import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import { StoredProtocolData } from '../../redux/protocol-storage'
import { getProtocolDisplayName } from './utils'

export type ProtocolSort =
  | 'alphabetical'
  | 'reverse'
  | 'recent'
  | 'oldest'
  | 'flex'
  | 'ot2'

export function useSortedProtocols(
  sortBy: ProtocolSort,
  protocolData: StoredProtocolData[]
): StoredProtocolData[] {
  protocolData.sort((a, b) => {
    const protocolNameA = getProtocolDisplayName(
      a.protocolKey,
      a.srcFileNames,
      a?.mostRecentAnalysis
    )
    const protocolNameB = getProtocolDisplayName(
      b.protocolKey,
      b.srcFileNames,
      b?.mostRecentAnalysis
    )
    const protocolRobotTypeA = a?.mostRecentAnalysis?.robotType
    const protocolRobotTypeB = b?.mostRecentAnalysis?.robotType

    if (sortBy === 'alphabetical') {
      if (protocolNameA.toLowerCase() === protocolNameB.toLowerCase()) {
        return b.modified - a.modified
      }
      return protocolNameA.toLowerCase() > protocolNameB.toLowerCase() ? 1 : -1
    } else if (sortBy === 'reverse') {
      return protocolNameA.toLowerCase() > protocolNameB.toLowerCase() ? -1 : 1
    } else if (sortBy === 'recent') {
      return b.modified - a.modified
    } else if (sortBy === 'oldest') {
      return a.modified - b.modified
    } else if (sortBy === 'flex') {
      if (
        protocolRobotTypeA === FLEX_ROBOT_TYPE &&
        protocolRobotTypeB !== FLEX_ROBOT_TYPE
      ) {
        return -1
      }
      if (
        protocolRobotTypeA !== FLEX_ROBOT_TYPE &&
        protocolRobotTypeB === FLEX_ROBOT_TYPE
      ) {
        return 1
      }
      return b.modified - a.modified
    } else if (sortBy === 'ot2') {
      if (
        protocolRobotTypeA !== FLEX_ROBOT_TYPE &&
        protocolRobotTypeB === FLEX_ROBOT_TYPE
      ) {
        return -1
      }
      if (
        protocolRobotTypeA === FLEX_ROBOT_TYPE &&
        protocolRobotTypeB !== FLEX_ROBOT_TYPE
      ) {
        return 1
      }
      return b.modified - a.modified
    }
    return 0
  })
  return protocolData
}
