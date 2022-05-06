import { StoredProtocolData } from '../../redux/protocol-storage'
import { getProtocolDisplayName } from './utils'

export type ProtocolSort = 'alphabetical' | 'reverse' | 'recent' | 'oldest'

export function useSortedProtocols(
  sortBy: ProtocolSort,
  protocolData: StoredProtocolData[]
): StoredProtocolData[] {
  protocolData.sort((a, b) => {
    const protocolNameA =
      a.mostRecentAnalysis.metadata.protocolName != null
        ? a.mostRecentAnalysis.metadata.protocolName
        : getProtocolDisplayName(a.protocolKey, a.srcFileNames)
    const protocolNameB =
      b.mostRecentAnalysis.metadata.protocolName != null
        ? b.mostRecentAnalysis.metadata.protocolName
        : getProtocolDisplayName(b.protocolKey, b.srcFileNames)
    if (sortBy === 'alphabetical') {
      return protocolNameA.toLowerCase() > protocolNameB.toLowerCase() ? 1 : -1
    } else if (sortBy === 'reverse') {
      return protocolNameA.toLowerCase() > protocolNameB.toLowerCase() ? -1 : 1
    } else if (sortBy === 'recent') {
      return b.modified - a.modified
    } else if (sortBy === 'oldest') {
      return a.modified - b.modified
    }
    return 0
  })
  return protocolData
}
