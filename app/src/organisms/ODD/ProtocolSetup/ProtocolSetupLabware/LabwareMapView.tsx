import { useMemo } from 'react'

import { BaseDeck, Flex } from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getLabwareDefinitionsByURIForProtocol,
  getLabwareOnDeck,
  getModuleFromStack,
  getSimplestDeckConfigForProtocol,
  getStacksOnModules,
  getTopLabwareFromStack,
  getWellFillFromLabwareId,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'

import { getStandardDeckViewLayerBlockList } from '/app/local-resources/deck_configuration'

import type { Dispatch, SetStateAction } from 'react'
import type { LabwareOnDeck } from '@opentrons/components'
import type {
  CompletedProtocolAnalysis,
  LabwareByLiquidId,
  ModuleModel,
  StackedItemsOnDeck,
  StackItem,
} from '@opentrons/shared-data'

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
  const modulesOnDeck = Object.entries(getStacksOnModules(startingDeck)).map(
    ([slotName, stackedItems]) => {
      const module = getModuleFromStack(stackedItems)
      const topLabwareInfo = getTopLabwareFromStack(stackedItems)
      const topLabwareDefinition =
        topLabwareInfo != null
          ? definitionsByURI[topLabwareInfo.definitionUri]
          : null
      const isLabwareStacked = topLabwareInfo != null && stackedItems.length > 2
      const wellFill =
        topLabwareInfo != null
          ? getWellFillFromLabwareId(
              topLabwareInfo.labwareId,
              mostRecentAnalysis?.liquids ?? [],
              labwareByLiquidId
            )
          : undefined
      return {
        moduleModel: module?.moduleModel ?? ('' as ModuleModel),
        moduleLocation: { slotName: module?.moduleSlotName ?? slotName },
        innerProps:
          module?.moduleModel === THERMOCYCLER_MODULE_V1
            ? { lidMotorState: 'open' }
            : {},
        nestedLabwareDef: topLabwareDefinition,
        nestedLabwareWellFill: wellFill,
        onLabwareClick:
          topLabwareInfo != null
            ? () => {
                handleLabwareClick([slotName, stackedItems])
              }
            : undefined,
        highlightLabware: true,
        stacked: isLabwareStacked,
      }
    }
  )

  const labwareLocations: Array<LabwareOnDeck | null> = Object.entries(
    getLabwareOnDeck(startingDeck)
  ).map(([slotName, stackedItems]) => {
    const topLabwareInfo = getTopLabwareFromStack(stackedItems)
    const topLabwareDefinition =
      topLabwareInfo != null
        ? definitionsByURI[topLabwareInfo.definitionUri]
        : null
    if (topLabwareInfo == null || topLabwareDefinition == null) return null

    const isLabwareInStack = stackedItems.length > 1
    const wellFill = getWellFillFromLabwareId(
      topLabwareInfo.labwareId,
      mostRecentAnalysis?.liquids ?? [],
      labwareByLiquidId
    )

    return {
      labwareLocation: { slotName },
      definition: topLabwareDefinition,
      onLabwareClick: () => {
        handleLabwareClick([slotName, stackedItems])
      },
      wellFill: wellFill,
      highlight: true,
      stacked: isLabwareInStack,
    }
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
