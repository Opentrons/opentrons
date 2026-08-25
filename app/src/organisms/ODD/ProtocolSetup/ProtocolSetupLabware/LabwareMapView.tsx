import { useMemo } from 'react'

import {
  BaseDeck,
  CenterLabwareInSlot,
  Flex,
  LabwareRender,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getLabwareDefinitionsByURIForProtocol,
  getLabwareOnDeck,
  getSimplestDeckConfigForProtocol,
  getStacksOnModules,
  getTopLabwareFromStack,
  getWellFillFromLabwareId,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'

import { getStandardDeckViewLayerBlockList } from '/app/local-resources/deck_configuration'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { LabwareOnDeck } from '@opentrons/components'
import type {
  CompletedProtocolAnalysis,
  LabwareByLiquidId,
  StackedItemsOnDeck,
  StackItem,
} from '@opentrons/shared-data'

interface LabwareMapViewProps {
  handleLabwareClick: Dispatch<SetStateAction<[string, StackItem[]] | null>>
  mostRecentAnalysis: CompletedProtocolAnalysis | null
  startingDeck: StackedItemsOnDeck
  labwareByLiquidId: LabwareByLiquidId
}

export function LabwareMapView(props: LabwareMapViewProps): ReactNode {
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
    ([slotName, { allItemsInStack: stackedItems, moduleInStack: module }]) => {
      const topLabwareInfo = getTopLabwareFromStack(stackedItems)
      const topLabwareDefinition =
        topLabwareInfo != null
          ? definitionsByURI[topLabwareInfo.definitionUri]
          : null
      // TODO: ja 8.27.25: find a better way to find the matching lid def without
      // relying on the lidDisplayNames
      // TODO: mm 12.3.25: deduplicate with other places where we're doing the same thing
      // (grep for matchingLidDef)
      const matchingLidDef = Object.values(definitionsByURI).find(
        uri => uri.metadata.displayName === topLabwareInfo?.lidDisplayName
      )
      const isLabwareStacked = topLabwareInfo != null && stackedItems.length > 2
      const wellFill =
        topLabwareInfo != null
          ? getWellFillFromLabwareId(
              topLabwareInfo.labwareId,
              mostRecentAnalysis?.liquids ?? [],
              labwareByLiquidId,
              mostRecentAnalysis?.commands ?? []
            )
          : undefined
      return {
        moduleModel: module.moduleModel,
        moduleLocation: { slotName: module.moduleSlotName },
        innerProps:
          module.moduleModel === THERMOCYCLER_MODULE_V1
            ? { lidMotorState: 'open' }
            : {},
        nestedLabwareDefsBottomToTop: [
          ...(topLabwareDefinition != null ? [topLabwareDefinition] : []),
          ...(matchingLidDef != null ? [matchingLidDef] : []),
        ],
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
    // TODO: ja 8.27.25: find a better way to find the matching lid def without
    // relying on the lidDisplayNames
    // TODO: mm 12.3.25: deduplicate with other places where we're doing the same thing
    // (grep for matchingLidDef)
    const matchingLidDef = Object.values(definitionsByURI).find(
      uri => uri.metadata.displayName === topLabwareInfo?.lidDisplayName
    )
    if (topLabwareInfo == null || topLabwareDefinition == null) return null

    const isLabwareInStack = stackedItems.length > 1
    const wellFill = getWellFillFromLabwareId(
      topLabwareInfo.labwareId,
      mostRecentAnalysis?.liquids ?? [],
      labwareByLiquidId,
      mostRecentAnalysis?.commands ?? []
    )

    return {
      labwareLocation: { slotName },
      definition: topLabwareDefinition,
      onLabwareClick: () => {
        handleLabwareClick([slotName, stackedItems])
      },
      wellFill,
      highlight: true,
      stacked: isLabwareInStack,
      labwareChildren:
        matchingLidDef != null ? (
          <CenterLabwareInSlot definition={matchingLidDef}>
            <LabwareRender
              definition={matchingLidDef}
              positioningMode="passThrough"
            />
          </CenterLabwareInSlot>
        ) : null,
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
