import { useMemo } from 'react'

import {
  FLEX_ROBOT_TYPE,
  getLabwareDefinitionsByURIForProtocol,
  getLabwareInfoByLiquidId,
  getLabwareOnDeck,
  getSimplestDeckConfigForProtocol,
  getStackedItemsOnStartingDeck,
  getStacksOnModules,
  getStandardDeckViewLayerBlockList,
  getTopLabwareFromStack,
  getWellFillFromLabwareId,
} from '@opentrons/shared-data'

import { BaseDeck, LabwareOnDeck } from '../../hardware-sim/BaseDeck'

import type { ComponentProps } from 'react'
import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'

interface ProtocolDeckProps {
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput | null
  /** extra props to pass through to BaseDeck component */
  baseDeckProps?: Partial<ComponentProps<typeof BaseDeck>>
}

export function ProtocolDeck(props: ProtocolDeckProps): JSX.Element | null {
  const { protocolAnalysis, baseDeckProps } = props
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
  if (protocolAnalysis == null || (protocolAnalysis?.errors ?? []).length > 0)
    return null

  const robotType = protocolAnalysis.robotType ?? FLEX_ROBOT_TYPE
  const deckConfig = getSimplestDeckConfigForProtocol(protocolAnalysis)
  const labwareByLiquidId = getLabwareInfoByLiquidId(protocolAnalysis.commands)

  const modulesOnDeck = Object.entries(getStacksOnModules(startingDeck)).map(
    ([slotName, { allItemsInStack: stackedItems, moduleInStack: module }]) => {
      const topLabwareInfo = getTopLabwareFromStack(stackedItems)
      const topLabwareDefinition =
        topLabwareInfo != null
          ? labwareDefinitionsByURI[topLabwareInfo.definitionUri]
          : null

      return {
        moduleModel: module.moduleModel,
        moduleLocation: { slotName: module.moduleSlotName },
        nestedLabwareDef: topLabwareDefinition,
        nestedLabwareWellFill:
          topLabwareInfo != null
            ? getWellFillFromLabwareId(
                topLabwareInfo.labwareId,
                protocolAnalysis.liquids,
                labwareByLiquidId
              )
            : undefined,
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
    return topLabwareDefinition != null && topLabwareInfo != null
      ? {
          definition: topLabwareDefinition,
          labwareLocation: { slotName },
          wellFill: getWellFillFromLabwareId(
            topLabwareInfo.labwareId,
            protocolAnalysis.liquids,
            labwareByLiquidId
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
