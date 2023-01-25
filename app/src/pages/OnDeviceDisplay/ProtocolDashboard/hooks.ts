import type { ProtocolResource } from '@opentrons/shared-data'
import type { RunData } from '@opentrons/api-client'

export type ProtocolSortKeyType =
  | 'alphabetical'
  | 'reverse'
  | 'recent'
  | 'oldest'
  | 'recentRun'
  | 'oldRun'
  | 'recentCreated'
  | 'oldCreated'

export function useSortProtocols(
  sortBy: ProtocolSortKeyType,
  protocols: ProtocolResource[],
  runs: RunData[]
): ProtocolResource[] {
  protocols.sort((a, b) => {
    const aName = a.metadata.protocolName ?? a.files[0].name
    const bName = a.metadata.protocolName ?? b.files[0].name
    const aLastRun = new Date(
      runs.find(run => run.protocolId === a.id)?.completedAt ?? 0
    )
    const bLastRun = new Date(
      runs.find(run => run.protocolId === b.id)?.completedAt ?? 0
    )
    const aDate = new Date(a.createdAt)
    const bDate = new Date(b.createdAt)
    switch (sortBy) {
      case 'alphabetical':
        if (aName.toLowerCase() === bName.toLowerCase()) {
          return bLastRun.valueOf() - aLastRun.valueOf()
        }
        return aName.toLowerCase() > bName.toLowerCase() ? 1 : -1
      case 'reverse':
        return aName.toLowerCase() > bName.toLowerCase() ? -1 : 1
      case 'recentRun':
        return bLastRun.valueOf() - aLastRun.valueOf()
      case 'oldRun':
        return aLastRun.valueOf() - bLastRun.valueOf()
      case 'recentCreated':
        return bDate.valueOf() - aDate.valueOf()
      case 'oldCreated':
        return aDate.valueOf() - bDate.valueOf()
      default:
        return 0
    }
  })
  return protocols
}
