import { useMemo } from 'react'
import { BaseDeck } from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getSimplestDeckConfigForProtocol,
} from '@opentrons/shared-data'
import {
  getLabwareDefinitionsByURIForProtocol,
  getStackedItemsOnStartingDeck,
} from '/app/transformations/commands'
import { 
  getLabwareInfoByLiquidId, 
  getStandardDeckViewLayerBlockList, 
  getWellFillFromLabwareId, 
} from './utils'

import type { ComponentProps } from 'react'
import type { LabwareOnDeck } from '@opentrons/components'
import type {
  CompletedProtocolAnalysis,
  ModuleModel,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import type {
  ModuleInStack,
  LabwareInStack,
} from '/app/transformations/commands'

export * from './utils'
export * from './types'
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

    return {
        moduleModel: module?.moduleModel ?? ('' as ModuleModel),
        moduleLocation: { slotName: module?.moduleSlotName ?? slotName },
        nestedLabwareDef: topLabwareDefinition,
        nestedLabwareWellFill: getWellFillFromLabwareId(
          topLabwareId ?? '',
          protocolAnalysis.liquids,
          labwareByLiquidId
        ),
      }
    }
  )

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
      return topLabwareDefinition != null ? {
        definition: topLabwareDefinition,
        labwareLocation: { slotName },
        wellFill: getWellFillFromLabwareId(
          topLabwareId,
          protocolAnalysis.liquids,
          labwareByLiquidId
        ),
      } : null
    }
  )
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
