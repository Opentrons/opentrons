import { getWellFillFromLabwareId } from '@opentrons/shared-data'

import type {
  CompletedProtocolAnalysis,
  LabwareByLiquidId,
  LabwareInStack,
  ProtocolAnalysisOutput,
  StackedItemsOnDeck,
} from '@opentrons/shared-data'

export interface OffDeckRenderGroup {
  quantity: number
  representativeItem: LabwareInStack
  stackedItems: LabwareInStack[]
}

interface WellFillInfo {
  hasLiquid: boolean
  signature: string
}

const getWellFillInfo = (
  labwareId: string,
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput,
  labwareByLiquidId: LabwareByLiquidId
): WellFillInfo => {
  const wellFill = getWellFillFromLabwareId(
    labwareId,
    protocolAnalysis.liquids,
    labwareByLiquidId,
    protocolAnalysis.commands
  )
  const sortedWellFill = Object.entries(wellFill).sort(
    ([wellNameA], [wellNameB]) => wellNameA.localeCompare(wellNameB)
  )

  return {
    hasLiquid: sortedWellFill.length > 0,
    signature: JSON.stringify(sortedWellFill),
  }
}

export function getOffDeckRenderGroups(
  stackedItems: StackedItemsOnDeck,
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput,
  labwareByLiquidId: LabwareByLiquidId
): OffDeckRenderGroup[] {
  const offDeckItems = (stackedItems.offDeck?.[0] ?? []).filter(
    (item): item is LabwareInStack => 'labwareId' in item
  )

  return offDeckItems.reduce<OffDeckRenderGroup[]>((acc, stackItem) => {
    const wellFillInfo = getWellFillInfo(
      stackItem.labwareId,
      protocolAnalysis,
      labwareByLiquidId
    )
    const matchingLabwareIndex = acc.findIndex(
      group =>
        !wellFillInfo.hasLiquid &&
        group.representativeItem.definitionUri === stackItem.definitionUri &&
        group.representativeItem.displayName === stackItem.displayName &&
        group.representativeItem.lidDisplayName === stackItem.lidDisplayName &&
        getWellFillInfo(
          group.representativeItem.labwareId,
          protocolAnalysis,
          labwareByLiquidId
        ).signature === wellFillInfo.signature
    )

    if (matchingLabwareIndex !== -1) {
      acc[matchingLabwareIndex].quantity += 1
      acc[matchingLabwareIndex].stackedItems.push(stackItem)
    } else {
      acc.push({
        quantity: 1,
        representativeItem: stackItem,
        stackedItems: [stackItem],
      })
    }
    return acc
  }, [])
}
