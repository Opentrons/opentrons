import { useMemo, useState } from 'react'

import {
  BaseDeck,
  Box,
  DIRECTION_COLUMN,
  Flex,
  getLabwareInfoByLiquidId,
  getWellFillFromLabwareId,
  SPACING,
  STACKER_HOPPER_LABWARE_X_OFFSET,
  STACKER_HOPPER_LABWARE_Y_OFFSET,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getSimplestDeckConfigForProtocol,
  THERMOCYCLER_MODULE_V1,
  FLEX_STACKER_MODULE_V1,
} from '@opentrons/shared-data'

import { getStandardDeckViewLayerBlockList } from '/app/local-resources/deck_configuration'
import { getProtocolModulesInfo } from '/app/transformations/analysis'
import {
  getLabwareDefinitionsByURIForProtocol,
  getStackedItemsOnStartingDeck,
} from '/app/transformations/commands'

import { LabwareInfoOverlay } from '../LabwareInfoOverlay'
import { OffDeckLabwareList } from './OffDeckLabwareList'
import { SlotDetailModal } from './SlotDetailModal'

import type { LabwareOnDeck } from '@opentrons/components'
import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import type {
  ModuleInStack,
  LabwareInStack,
  StackItem,
} from '/app/transformations/commands'

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
          ? labwareDefinitionsByURI[topLabwareInfo.definitionUri]
          : null
      const topLabwareId =
        topLabwareInfo != null && 'labwareId' in topLabwareInfo
          ? topLabwareInfo.labwareId
          : ''
      const topLabwareDisplayName =
        topLabwareInfo != null && 'labwareId' in topLabwareInfo
          ? topLabwareInfo.displayName
          : ''

      const isLabwareStacked = stackOnModule != null && stackOnModule.length > 1
      const wellFill = getWellFillFromLabwareId(
        topLabwareId,
        protocolAnalysis.liquids,
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
        highlightLabware: hoverLabwareId === topLabwareId,
        stacked: isLabwareStacked,
        moduleChildren: (
          // open modal
          <g
            onClick={() => {
              if (stackOnModule != null) {
                setSelectedStack({
                  slotName: slotName,
                  stack: stackOnModule,
                })
              }
            }}
            onMouseEnter={() => {
              if (topLabwareDefinition != null && topLabwareId != null) {
                setHoverLabwareId(topLabwareId)
              }
            }}
            onMouseLeave={() => {
              setHoverLabwareId(null)
            }}
            cursor={'pointer'}
          >
            {topLabwareDefinition != null && topLabwareInfo != null ? (
              <LabwareInfoOverlay
                definition={topLabwareDefinition}
                labwareId={topLabwareId}
                displayName={topLabwareDisplayName}
                runId={runId}
                labwareHasLiquid={Object.values(wellFill).length > 0}
                xOffset={
                  module?.moduleModel === FLEX_STACKER_MODULE_V1
                    ? STACKER_HOPPER_LABWARE_X_OFFSET
                    : 0
                }
                yOffset={
                  module?.moduleModel === FLEX_STACKER_MODULE_V1
                    ? STACKER_HOPPER_LABWARE_Y_OFFSET
                    : 0
                }
              />
            ) : null}
          </g>
        ),
      }
    })

  const deckConfig = getSimplestDeckConfigForProtocol(protocolAnalysis)

  const labwareOnDeck: Array<LabwareOnDeck | null> = Object.entries(
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
          ? labwareDefinitionsByURI[topLabwareInfo.definitionUri]
          : null
      const topLabwareId =
        topLabwareInfo != null && 'labwareId' in topLabwareInfo
          ? topLabwareInfo.labwareId
          : ''
      const topLabwareDisplayName =
        topLabwareInfo != null && 'labwareId' in topLabwareInfo
          ? topLabwareInfo.displayName
          : ''
      const isLabwareInStack = stackedItems.length > 1
      const wellFill = getWellFillFromLabwareId(
        topLabwareId ?? '',
        protocolAnalysis.liquids,
        labwareByLiquidId
      )

      return topLabwareDefinition != null
        ? {
            labwareLocation: { slotName },
            definition: topLabwareDefinition,
            highlight: hoverLabwareId === topLabwareId,
            stacked: isLabwareInStack,
            wellFill: wellFill,
            labwareChildren: (
              <g
                cursor={'pointer'}
                onClick={() => {
                  setSelectedStack({ slotName: slotName, stack: stackedItems })
                }}
                onMouseEnter={() => {
                  if (topLabwareDefinition != null && topLabwareId != null) {
                    setHoverLabwareId(() => topLabwareId)
                  }
                }}
                onMouseLeave={() => {
                  setHoverLabwareId(null)
                }}
              >
                {topLabwareDisplayName != null ? (
                  <LabwareInfoOverlay
                    definition={topLabwareDefinition}
                    labwareId={topLabwareId}
                    displayName={topLabwareDisplayName}
                    runId={runId}
                    labwareHasLiquid={Object.values(wellFill).length > 0}
                  />
                ) : null}
              </g>
            ),
          }
        : null
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
