import { useMemo } from 'react'

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
  getStandardDeckViewLayerBlockList,
  getTopLabwareFromStack,
  getWellFillFromLabwareId,
} from '@opentrons/shared-data'

import {
  AlignToModuleChildSlot,
  CenterLabwareInSlot,
  LabwareInfoOverlay,
  LabwareRender,
  STACKER_HOPPER_LABWARE_X_OFFSET,
} from '../..'
import { BaseDeck } from '../../hardware-sim/BaseDeck'

import type { ComponentProps } from 'react'
import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import type { LabwareOnDeck } from '../../hardware-sim/BaseDeck'

interface ProtocolDeckProps {
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput | null
  /** extra props to pass through to BaseDeck component */
  baseDeckProps?: Partial<ComponentProps<typeof BaseDeck>>
  showLabwareLabels?: boolean
}

export function ProtocolDeck(props: ProtocolDeckProps): JSX.Element | null {
  const { protocolAnalysis, baseDeckProps, showLabwareLabels = false } = props
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
  if (protocolAnalysis == null || (protocolAnalysis?.errors ?? []).length > 0) {
    return null
  }
  const robotType = protocolAnalysis.robotType ?? FLEX_ROBOT_TYPE
  const deckDef = getDeckDefFromRobotType(robotType)
  const deckConfig = getSimplestDeckConfigForProtocol(protocolAnalysis)
  const labwareByLiquidId = getLabwareInfoByLiquidId(protocolAnalysis.commands)

  const modulesOnDeck = Object.entries(getStacksOnModules(startingDeck)).map(
    ([slotName, { allItemsInStack: stackedItems, moduleInStack: module }]) => {
      const topLabwareInfo = getTopLabwareFromStack(stackedItems)
      const topLabwareDefinition =
        topLabwareInfo != null
          ? labwareDefinitionsByURI[topLabwareInfo.definitionUri]
          : null
      // TODO: ja 8.27.25: find a better way to find the matching lid def without
      // relying on the lidDisplayNames
      const matchingLidDef = Object.values(labwareDefinitionsByURI).find(
        uri => uri.metadata.displayName === topLabwareInfo?.lidDisplayName
      )
      const moduleType = getModuleType(module.moduleModel)
      const moduleDefinition = getModuleDef(module.moduleModel)

      return {
        moduleModel: module.moduleModel,
        moduleLocation: { slotName: module.moduleSlotName },
        nestedLabwareDefsBottomToTop: [
          ...(topLabwareDefinition != null ? [topLabwareDefinition] : []),
          ...(matchingLidDef != null ? [matchingLidDef] : []),
        ],
        nestedLabwareWellFill:
          topLabwareInfo != null
            ? getWellFillFromLabwareId(
                topLabwareInfo.labwareId,
                protocolAnalysis.liquids,
                labwareByLiquidId,
                protocolAnalysis.commands
              )
            : undefined,
        moduleChildren: showLabwareLabels ? (
          topLabwareDefinition != null && topLabwareInfo != null ? (
            <AlignToModuleChildSlot
              deckId={deckDef.otId}
              slotId={slotName}
              moduleDefinition={moduleDefinition}
            >
              <LabwareInfoOverlay
                definition={topLabwareDefinition}
                labwareId={topLabwareInfo.labwareId}
                displayName={topLabwareInfo.displayName}
                labwareHasLiquid={false}
                xOffset={
                  moduleType === FLEX_STACKER_MODULE_TYPE
                    ? STACKER_HOPPER_LABWARE_X_OFFSET
                    : 0
                }
              />
            </AlignToModuleChildSlot>
          ) : null
        ) : null,
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
    const matchingLidDef = Object.values(labwareDefinitionsByURI).find(
      uri => uri.metadata.displayName === topLabwareInfo?.lidDisplayName
    )
    return topLabwareDefinition != null && topLabwareInfo != null
      ? {
          definition: topLabwareDefinition,
          labwareLocation: { slotName },
          wellFill: getWellFillFromLabwareId(
            topLabwareInfo.labwareId,
            protocolAnalysis.liquids,
            labwareByLiquidId,
            protocolAnalysis.commands
          ),
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
              {showLabwareLabels ? (
                <LabwareInfoOverlay
                  definition={topLabwareDefinition}
                  labwareId={topLabwareInfo.labwareId}
                  displayName={topLabwareInfo.displayName}
                  labwareHasLiquid={false}
                />
              ) : null}
            </>
          ),
        }
      : null
  })
  const labwareOnDeckFiltered: LabwareOnDeck[] = labwareOnDeck.filter(
    (labware): labware is LabwareOnDeck => labware != null
  )
  return (
    <BaseDeck
      deckConfig={deckConfig}
      deckLayerBlocklist={getStandardDeckViewLayerBlockList(robotType)}
      robotType={robotType}
      labwareOnDeck={labwareOnDeckFiltered}
      modulesOnDeck={modulesOnDeck}
      {...{
        svgProps: {
          'aria-label': 'protocol deck map',
          ...(baseDeckProps?.svgProps ?? {}),
        },
        ...baseDeckProps,
      }}
    />
  )
}
