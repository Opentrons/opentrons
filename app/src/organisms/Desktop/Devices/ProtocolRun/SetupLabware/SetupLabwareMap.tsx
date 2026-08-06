import { useMemo, useState } from 'react'

import {
  AlignToModuleChildSlot,
  BaseDeck,
  Box,
  CenterLabwareInSlot,
  DIRECTION_COLUMN,
  Flex,
  LabwareInfoOverlay,
  LabwareRender,
  SPACING,
  STACKER_HOPPER_LABWARE_X_OFFSET,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  getDeckDefFromRobotType,
  getLabwareDefinitionsByURIForProtocol,
  getLabwareInfoByLiquidId,
  getLabwareOnDeck,
  getModuleDef,
  getModuleType,
  getSimplestDeckConfigForProtocol,
  getStackedItemsOnStartingDeck,
  getStacksOnModules,
  getTopLabwareFromStack,
  getWellFillFromLabwareId,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'

import { getStandardDeckViewLayerBlockList } from '/app/local-resources/deck_configuration'
import { getOffDeckRenderGroups } from '/app/resources/protocols/utils/getOffDeckRenderGroups'

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
    return getSimplestDeckConfigForProtocol(protocolAnalysis)
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
  const labwareByLiquidId = useMemo(
    () => getLabwareInfoByLiquidId(protocolAnalysis?.commands ?? []),
    [protocolAnalysis]
  )
  const offDeckItems = useMemo(
    () =>
      protocolAnalysis != null
        ? getOffDeckRenderGroups(
            startingDeck,
            protocolAnalysis,
            labwareByLiquidId
          )
        : [],
    [startingDeck, protocolAnalysis, labwareByLiquidId]
  )
  // early return null if no protocol analysis
  if (protocolAnalysis == null) return null

  const robotType = protocolAnalysis.robotType ?? FLEX_ROBOT_TYPE
  const deckDef = getDeckDefFromRobotType(robotType)

  const modulesOnDeck = Object.entries(getStacksOnModules(startingDeck)).map(
    ([slotName, { allItemsInStack: stackedItems, moduleInStack: module }]) => {
      const topLabwareInfo = getTopLabwareFromStack(stackedItems)
      const topLabwareDefinition =
        topLabwareInfo != null
          ? labwareDefinitionsByURI[topLabwareInfo.definitionUri]
          : null
      // TODO: ja 8.27.25: find a better way to find the matching lid def without
      // relying on the lidDisplayNames
      // TODO: mm 12.3.25: deduplicate with other places where we're doing the same thing
      // (grep for matchingLidDef)
      const matchingLidDef = Object.values(labwareDefinitionsByURI).find(
        uri => uri.metadata.displayName === topLabwareInfo?.lidDisplayName
      )
      const isLabwareStacked = topLabwareInfo != null && stackedItems.length > 2
      const wellFill =
        topLabwareInfo != null
          ? getWellFillFromLabwareId(
              topLabwareInfo.labwareId,
              protocolAnalysis.liquids,
              labwareByLiquidId,
              protocolAnalysis.commands
            )
          : undefined

      const moduleType = getModuleType(module.moduleModel)
      const moduleDefinition = getModuleDef(module.moduleModel)

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
              <AlignToModuleChildSlot
                deckId={deckDef.otId}
                slotId={slotName}
                moduleDefinition={moduleDefinition}
              >
                <LabwareInfoOverlay
                  definition={topLabwareDefinition}
                  labwareId={topLabwareInfo.labwareId}
                  displayName={topLabwareInfo.displayName}
                  labwareHasLiquid={
                    wellFill != null && Object.values(wellFill).length > 0
                  }
                  xOffset={
                    moduleType === FLEX_STACKER_MODULE_TYPE
                      ? STACKER_HOPPER_LABWARE_X_OFFSET
                      : 0
                  }
                />
              </AlignToModuleChildSlot>
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
    // TODO: ja 8.27.25: find a better way to find the matching lid def without
    // relying on the lidDisplayNames
    // TODO: mm 12.3.25: deduplicate with other places where we're doing the same thing
    // (grep for matchingLidDef)
    const matchingLidDef = Object.values(labwareDefinitionsByURI).find(
      uri => uri.metadata.displayName === topLabwareInfo?.lidDisplayName
    )
    if (topLabwareInfo == null || topLabwareDefinition == null) return null
    const isLabwareInStack = stackedItems.length > 1
    const wellFill = getWellFillFromLabwareId(
      topLabwareInfo.labwareId,
      protocolAnalysis.liquids,
      labwareByLiquidId,
      protocolAnalysis.commands
    )

    return {
      labwareLocation: { slotName },
      definition: topLabwareDefinition,
      highlight: hoverLabwareId === topLabwareInfo.labwareId,
      stacked: isLabwareInStack,
      wellFill,
      labwareChildren: (
        <>
          {matchingLidDef != null ? (
            <CenterLabwareInSlot definition={matchingLidDef}>
              <LabwareRender
                definition={matchingLidDef}
                positioningMode="passThrough"
              />
            </CenterLabwareInSlot>
          ) : null}
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
              labwareHasLiquid={Object.values(wellFill).length > 0}
            />
          </g>
        </>
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
        <OffDeckLabwareList
          offDeckItems={offDeckItems}
          isFlex={robotType === FLEX_ROBOT_TYPE}
          setSelectedStack={setSelectedStack}
          definitionsByURI={labwareDefinitionsByURI}
        />
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
