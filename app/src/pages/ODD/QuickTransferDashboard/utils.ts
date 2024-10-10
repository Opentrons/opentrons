import type { ProtocolResource } from '@opentrons/shared-data'
import type { ProtocolsOnDeviceSortKey } from '/app/redux/config/types'

export function sortQuickTransfers(
  sortBy: ProtocolsOnDeviceSortKey,
  transfers: ProtocolResource[]
): ProtocolResource[] {
  transfers.sort((a, b) => {
    const aName = a.metadata.protocolName ?? a.files[0].name
    const bName = b.metadata.protocolName ?? b.files[0].name

    const aDate = new Date(a.createdAt)
    const bDate = new Date(b.createdAt)
    switch (sortBy) {
      case 'alphabetical':
        return aName.toLowerCase() > bName.toLowerCase() ? 1 : -1
      case 'reverse':
        return aName.toLowerCase() > bName.toLowerCase() ? -1 : 1
      case 'recentCreated':
        return bDate.valueOf() - aDate.valueOf()
      case 'oldCreated':
        return aDate.valueOf() - bDate.valueOf()
      default:
        return 0
    }
  })
  return transfers
}
