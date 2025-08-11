import { useMemo, useState } from 'react'

import {
  BaseDeck,
  Box,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  STACKER_HOPPER_LABWARE_X_OFFSET,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  getLabwareDefinitionsByURIForProtocol,
  getLabwareInfoByLiquidId,
  getLabwareOnDeck,
  getModuleType,
  getSimplestDeckConfigForProtocol,
  getStackedItemsOnStartingDeck,
  getStacksOnModules,
  getTopLabwareFromStack,
  getWellFillFromLabwareId,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'

import { getStandardDeckViewLayerBlockList } from '/app/local-resources/deck_configuration'

import { LabwareInfoOverlay } from '../LabwareInfoOverlay'
import { OffDeckLabwareList } from './OffDeckLabwareList'
import { SlotDetailModal } from './SlotDetailModal'

import type { LabwareOnDeck } from '@opentrons/components'
import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
  StackItem,
} from '@opentrons/shared-data'

interface SetupLabwareMapProps {
  runId: string
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput | null
}

export function SetupLabwareMap({
  runId,
  protocolAnalysis,
}: SetupLabwareMapProps): JSX.Element | null {
  const [selectedStack, setSelectedStack] = useState<{
    slotName: string
    stack: StackItem[]
  } | null>(null)
  const [hoverLabwareId, setHoverLabwareId] = useState<string | null>(null)

  const deckConfig = useMemo(() => {
      getSimplestDeckConfigForProtocol(protocolAnalysis)
  }, [protocolAnalysis])

  const startingDeck = useMemo(
    () =>
      getStackedItemsOnStartingDeck(
        protocolAnalysis?.commands ?? [],
        protocolAnalysis?.labware ?? [],
        protocolAnalysis?.modules ?? []
      ),
    [protocolAnalysis]
  )
  const labwareDefinitionsByURI = useMemo(
    () =>
      getLabwareDefinitionsByURIForProtocol(protocolAnalysis?.commands ?? []),
    [protocolAnalysis]
  )
  const offDeckItems = Object.keys(startingDeck).includes('offDeck')
    ? startingDeck.offDeck
    : null

  // early return null if no protocol analysis
  if (protocolAnalysis == null) return null

  const robotType = protocolAnalysis.robotType ?? FLEX_ROBOT_TYPE
  const labwareByLiquidId = getLabwareInfoByLiquidId(protocolAnalysis.commands)

  const modulesOnDeck = Object.entries(getStacksOnModules(startingDeck)).map(
    ([slotName, { allItemsInStack: stackedItems, moduleInStack: module }]) => {
      const topLabwareInfo = getTopLabwareFromStack(stackedItems)
      const topLabwareDefinition =
        topLabwareInfo != null
          ? labwareDefinitionsByURI[topLabwareInfo.definitionUri]
          : null

      const isLabwareStacked = topLabwareInfo != null && stackedItems.length > 2
      const wellFill =
        topLabwareInfo != null
          ? getWellFillFromLabwareId(
              topLabwareInfo.labwareId,
              protocolAnalysis.liquids,
              labwareByLiquidId
            )
          : undefined
      const moduleType = getModuleType(module.moduleModel)

      return {
        moduleModel: module.moduleModel,
        moduleLocation: { slotName: module.moduleSlotName },
        innerProps:
          module.moduleModel === THERMOCYCLER_MODULE_V1
            ? { lidMotorState: 'open' }
            : {},

        nestedLabwareDef: topLabwareDefinition,
        nestedLabwareWellFill: wellFill,
        highlightLabware: hoverLabwareId === topLabwareInfo?.labwareId,
        stacked: isLabwareStacked,
        moduleChildren: (
          // open modal
          <g
            onClick={() => {
              if (topLabwareInfo != null) {
                setSelectedStack({
                  slotName,
                  stack: stackedItems,
                })
              }
            }}
            onMouseEnter={() => {
              if (topLabwareDefinition != null && topLabwareInfo != null) {
                setHoverLabwareId(topLabwareInfo.labwareId)
              }
            }}
            onMouseLeave={() => {
              setHoverLabwareId(null)
            }}
            cursor="pointer"
          >
            {topLabwareDefinition != null && topLabwareInfo != null ? (
              <LabwareInfoOverlay
                definition={topLabwareDefinition}
                labwareId={topLabwareInfo.labwareId}
                displayName={topLabwareInfo.displayName}
                runId={runId}
                labwareHasLiquid={
                  wellFill != null && Object.values(wellFill).length > 0
                }
                xOffset={
                  moduleType === FLEX_STACKER_MODULE_TYPE
                    ? STACKER_HOPPER_LABWARE_X_OFFSET
                    : 0
                }
              />
            ) : null}
          </g>
        ),
      }
    }
  )
  const labwareOnDeck: Array<LabwareOnDeck | null> = Object.entries(
    getLabwareOnDeck(startingDeck)
  ).map(([slotName, stackedItems]) => {
    const topLabwareInfo = getTopLabwareFromStack(stackedItems)
    const topLabwareDefinition =
      topLabwareInfo != null
        ? labwareDefinitionsByURI[topLabwareInfo.definitionUri]
        : null
    if (topLabwareInfo == null || topLabwareDefinition == null) return null
    const isLabwareInStack = stackedItems.length > 1
    const wellFill = getWellFillFromLabwareId(
      topLabwareInfo.labwareId,
      protocolAnalysis.liquids,
      labwareByLiquidId
    )

    return {
      labwareLocation: { slotName },
      definition: topLabwareDefinition,
      highlight: hoverLabwareId === topLabwareInfo.labwareId,
      stacked: isLabwareInStack,
      wellFill,
      labwareChildren: (
        <g
          cursor="pointer"
          onClick={() => {
            setSelectedStack({ slotName, stack: stackedItems })
          }}
          onMouseEnter={() => {
            setHoverLabwareId(() => topLabwareInfo.labwareId)
          }}
          onMouseLeave={() => {
            setHoverLabwareId(null)
          }}
        >
          <LabwareInfoOverlay
            definition={topLabwareDefinition}
            labwareId={topLabwareInfo.labwareId}
            displayName={topLabwareInfo.displayName}
            runId={runId}
            labwareHasLiquid={Object.values(wellFill).length > 0}
          />
        </g>
      ),
    }
  })

  const labwareOnDeckFiltered: LabwareOnDeck[] = labwareOnDeck.filter(
    (labware): labware is LabwareOnDeck => labware != null
  )
  return (
    <Flex flex="1" flexDirection={DIRECTION_COLUMN}>
      <Flex flexDirection={DIRECTION_COLUMN} marginY={SPACING.spacing16}>
        <Box margin="0 auto" maxWidth="46.25rem" width="100%">
          <BaseDeck
            deckConfig={deckConfig}
            deckLayerBlocklist={getStandardDeckViewLayerBlockList(robotType)}
            robotType={robotType}
            labwareOnDeck={labwareOnDeckFiltered}
            modulesOnDeck={modulesOnDeck}
          />
        </Box>
        {offDeckItems != null ? (
          <OffDeckLabwareList
            labwareItems={offDeckItems}
            isFlex={robotType === FLEX_ROBOT_TYPE}
            setSelectedStack={setSelectedStack}
            definitionsByURI={labwareDefinitionsByURI}
          />
        ) : null}
      </Flex>
      {selectedStack != null ? (
        <SlotDetailModal
          stackedItems={selectedStack.stack}
          slotName={selectedStack.slotName}
          labwareByLiquidId={labwareByLiquidId}
          mostRecentAnalysis={protocolAnalysis}
          closeModal={() => {
            setSelectedStack(null)
          }}
          isFlex={robotType === FLEX_ROBOT_TYPE}
        />
      ) : null}
    </Flex>
  )
}
