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

const getWellFillSignature = (
  labwareId: string,
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput,
  labwareByLiquidId: LabwareByLiquidId
): string => {
  const wellFill = getWellFillFromLabwareId(
    labwareId,
    protocolAnalysis.liquids,
    labwareByLiquidId,
    protocolAnalysis.commands
  )

  return JSON.stringify(
    Object.entries(wellFill)
      .sort(([wellNameA], [wellNameB]) => wellNameA.localeCompare(wellNameB))
      .map(([wellName, fill]) => [wellName, fill])
  )
}

export function getOffDeckRenderGroups(
  stackedItems: StackedItemsOnDeck,
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput,
  labwareByLiquidId: LabwareByLiquidId
): OffDeckRenderGroup[] {
  const offDeckItems = Object.keys(stackedItems).includes('offDeck')
    ? stackedItems.offDeck.filter(
        (item): item is LabwareInStack => 'labwareId' in item
      )
    : []

  return offDeckItems.reduce<OffDeckRenderGroup[]>((acc, stackItem) => {
    const wellFillSignature = getWellFillSignature(
      stackItem.labwareId,
      protocolAnalysis,
      labwareByLiquidId
    )
    const matchingLabwareIndex = acc.findIndex(
      group =>
        group.representativeItem.definitionUri === stackItem.definitionUri &&
        group.representativeItem.displayName === stackItem.displayName &&
        group.representativeItem.lidDisplayName === stackItem.lidDisplayName &&
        getWellFillSignature(
          group.representativeItem.labwareId,
          protocolAnalysis,
          labwareByLiquidId
        ) === wellFillSignature
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
