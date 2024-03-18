import type { ProtocolResource } from '@opentrons/shared-data'
import type { RunData } from '@opentrons/api-client'
import type { ProtocolsOnDeviceSortKey } from '../../redux/config/types'

const DUMMY_FOR_NO_DATE_CASE = -8640000000000000

export function sortProtocols(
  sortBy: ProtocolsOnDeviceSortKey,
  protocols: ProtocolResource[],
  allRunsNewestFirst: RunData[]
): ProtocolResource[] {
  protocols.sort((a, b) => {
    const aName = a.metadata.protocolName ?? a.files[0].name
    const bName = b.metadata.protocolName ?? b.files[0].name
    const aLastRun = new Date(
      allRunsNewestFirst.find(run => run.protocolId === a.id)?.completedAt ??
        new Date(DUMMY_FOR_NO_DATE_CASE)
    )
    const bLastRun = new Date(
      allRunsNewestFirst.find(run => run.protocolId === b.id)?.completedAt ??
        new Date(DUMMY_FOR_NO_DATE_CASE)
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
