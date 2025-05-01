import { useMemo } from 'react'

import { BaseDeck, Flex } from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getSimplestDeckConfigForProtocol,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'

import { getStandardDeckViewLayerBlockList } from '/app/local-resources/deck_configuration'
import { getWellFillFromLabwareId } from '/app/organisms/ProtocolDeck'
import { getLabwareDefinitionsByURIForProtocol } from '/app/transformations/commands'

import type { Dispatch, SetStateAction } from 'react'
import type { LabwareOnDeck } from '@opentrons/components'
import type { LabwareByLiquidId } from '/app/organisms/ProtocolDeck'
import type { CompletedProtocolAnalysis, ModuleModel } from '@opentrons/shared-data'
import type {
  LabwareInStack,
  ModuleInStack,
  StackedItemsOnDeck,
  StackItem,
} from '/app/transformations/commands'

interface LabwareMapViewProps {
  handleLabwareClick: Dispatch<SetStateAction<[string, StackItem[]] | null>>
  mostRecentAnalysis: CompletedProtocolAnalysis | null
  startingDeck: StackedItemsOnDeck
  labwareByLiquidId: LabwareByLiquidId
}

export function LabwareMapView(props: LabwareMapViewProps): JSX.Element {
  const {
    handleLabwareClick,
    mostRecentAnalysis,
    startingDeck,
    labwareByLiquidId,
  } = props
  const deckConfig = getSimplestDeckConfigForProtocol(mostRecentAnalysis)
  const definitionsByURI = useMemo(
    () =>
      getLabwareDefinitionsByURIForProtocol(mostRecentAnalysis?.commands ?? []),
    [mostRecentAnalysis]
  )
  const modulesOnDeck = Object.entries(startingDeck)
    .filter(([key, value]) =>
      value.some(
        (stackItem): stackItem is ModuleInStack => 'moduleId' in stackItem
      )
    )
    .map(([slotName, stackedItems]) => {
      const stackOnModule = stackedItems.filter(
        (stackedItem): stackedItem is LabwareInStack =>
          'labwareId' in stackedItem
      )
      const module = stackedItems.find(
        (item): item is ModuleInStack => 'moduleId' in item
      )

    const topLabwareInfo = stackOnModule != null ? stackOnModule[0] : null
    const topLabwareDefinition =
      topLabwareInfo != null && 'labwareId' in topLabwareInfo
        ? definitionsByURI[topLabwareInfo.definitionUri]
        : null
    const topLabwareId =
      topLabwareInfo != null && 'labwareId' in topLabwareInfo
        ? topLabwareInfo.labwareId
        : ''
    const isLabwareStacked = stackOnModule != null && stackOnModule.length > 2
    const wellFill = getWellFillFromLabwareId(
      topLabwareId ?? '',
      mostRecentAnalysis?.liquids ?? [],
      labwareByLiquidId
    )
    return {
      moduleModel: module?.moduleModel ?? ('' as ModuleModel),
      moduleLocation: { slotName: module?.moduleSlotName ?? slotName },
      innerProps:
        module?.moduleModel === THERMOCYCLER_MODULE_V1
          ? { lidMotorState: 'open' }
          : {},
      nestedLabwareDef: topLabwareDefinition,
      nestedLabwareWellFill: wellFill,
      onLabwareClick: () => {
        stackOnModule.length > 0 ? handleLabwareClick([slotName, stackOnModule]) : null
      },
      highlightLabware: true,
      moduleChildren: null,
      stacked: isLabwareStacked,
    }
  })

  const labwareLocations: Array<LabwareOnDeck | null> = Object.entries(
    startingDeck
  )
    .filter(
      ([key, value]) =>
        key !== 'offDeck' &&
        !value.some(
          (stackItem): stackItem is ModuleInStack => 'moduleId' in stackItem
        )
    )
    .map(([slotName, stackedItems]) => {
      const topLabwareInfo = stackedItems[0]
      const topLabwareDefinition =
        topLabwareInfo != null && 'labwareId' in topLabwareInfo
          ? definitionsByURI[topLabwareInfo.definitionUri]
          : null
      const topLabwareId =
        topLabwareInfo != null && 'labwareId' in topLabwareInfo
          ? topLabwareInfo.labwareId
          : ''
      const isLabwareInStack = stackedItems.length > 1
      const wellFill = getWellFillFromLabwareId(
        topLabwareId ?? '',
        mostRecentAnalysis?.liquids ?? [],
        labwareByLiquidId
      )

      return topLabwareDefinition != null
        ? {
            labwareLocation: { slotName },
            definition: topLabwareDefinition,
            onLabwareClick: () => {
              handleLabwareClick([slotName, stackedItems])
            },
            wellFill: wellFill,
            highlight: true,
            stacked: isLabwareInStack,
          }
        : null
    })

  const labwareLocationsFiltered: LabwareOnDeck[] = labwareLocations.filter(
    (labwareLocation): labwareLocation is LabwareOnDeck =>
      labwareLocation != null
  )

  return (
    <Flex height="27.75rem">
      <BaseDeck
        deckConfig={deckConfig}
        deckLayerBlocklist={getStandardDeckViewLayerBlockList(FLEX_ROBOT_TYPE)}
        robotType={FLEX_ROBOT_TYPE}
        labwareOnDeck={labwareLocationsFiltered}
        modulesOnDeck={modulesOnDeck}
      />
    </Flex>
  )
}
