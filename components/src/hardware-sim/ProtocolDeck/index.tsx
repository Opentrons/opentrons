import * as React from 'react'

import {
  FLEX_ROBOT_TYPE,
  getLabwareDisplayName,
  getSimplestDeckConfigForProtocol,
  parseInitialLoadedLabwareByAdapter,
} from '@opentrons/shared-data'

import { BaseDeck } from '../BaseDeck'
import { LabwareInfo } from './LabwareInfo'
import { getStandardDeckViewLayerBlockList } from './utils'
import { getLabwareInfoByLiquidId } from './utils/getLabwareInfoByLiquidId'
import { getTopMostLabwareInSlots } from './utils/getLabwareInSlots'
import { getModulesInSlots } from './utils/getModulesInSlots'
import { getWellFillFromLabwareId } from './utils/getWellFillFromLabwareId'

import type {
  CompletedProtocolAnalysis,
  LabwareDefinition2,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'

export * from './utils/getStandardDeckViewLayerBlockList'

interface ProtocolDeckProps {
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput | null
  /** defaults to false, when set labware nicknames will appear on top level labware. If no nickname specified in protocol, falls back to labware definition display name */
  showLabwareInfo?: boolean
  /** optional labware click handler, highlights labware */
  handleLabwareClick?: (
    labwareDef: LabwareDefinition2,
    labwareId: string
  ) => void
  /** extra props to pass through to BaseDeck component */
  baseDeckProps?: Partial<React.ComponentProps<typeof BaseDeck>>
}

export function ProtocolDeck(props: ProtocolDeckProps): JSX.Element | null {
  const {
    protocolAnalysis,
    baseDeckProps,
    handleLabwareClick,
    showLabwareInfo = false,
  } = props

  if (protocolAnalysis == null || (protocolAnalysis?.errors ?? []).length > 0)
    return null

  const robotType = protocolAnalysis.robotType ?? FLEX_ROBOT_TYPE
  const deckConfig = getSimplestDeckConfigForProtocol(protocolAnalysis)
  const labwareByLiquidId = getLabwareInfoByLiquidId(protocolAnalysis.commands)
  const initialLoadedLabwareByAdapter = parseInitialLoadedLabwareByAdapter(
    protocolAnalysis.commands
  )

  const modulesInSlots = getModulesInSlots(protocolAnalysis)
  const modulesOnDeck = modulesInSlots.map(
    ({
      moduleModel,
      moduleLocation,
      nestedLabwareId,
      nestedLabwareDef,
      nestedLabwareNickName,
    }) => {
      const labwareInAdapterInMod =
        nestedLabwareId != null
          ? initialLoadedLabwareByAdapter[nestedLabwareId]
          : null
      //  only rendering the labware on top most layer so
      //  either the adapter or the labware are rendered but not both
      const topLabwareDefinition =
        labwareInAdapterInMod?.result?.definition ?? nestedLabwareDef
      const topLabwareId =
        labwareInAdapterInMod?.result?.labwareId ?? nestedLabwareId

      return {
        moduleModel,
        moduleLocation,
        nestedLabwareDef,
        nestedLabwareWellFill: getWellFillFromLabwareId(
          nestedLabwareId ?? '',
          protocolAnalysis.liquids,
          labwareByLiquidId
        ),
        moduleChildren:
          showLabwareInfo &&
          nestedLabwareDef != null &&
          !(nestedLabwareDef.allowedRoles ?? []).includes('adapter') ? (
            <LabwareInfo def={nestedLabwareDef}>
              {nestedLabwareNickName ?? getLabwareDisplayName(nestedLabwareDef)}
            </LabwareInfo>
          ) : null,
        highlightLabware: handleLabwareClick != null,
        onLabwareClick:
          handleLabwareClick != null &&
          topLabwareDefinition != null &&
          topLabwareId != null
            ? () => {
                handleLabwareClick(topLabwareDefinition, topLabwareId)
              }
            : undefined,
        stacked:
          handleLabwareClick != null &&
          topLabwareDefinition != null &&
          topLabwareId != null,
      }
    }
  )

  const topMostLabwareInSlots = getTopMostLabwareInSlots(protocolAnalysis)
  const labwareOnDeck = topMostLabwareInSlots.map(
    ({ labwareId, labwareDef, labwareNickName, location }) => {
      const labwareInAdapter = initialLoadedLabwareByAdapter[labwareId]
      //  only rendering the labware on top most layer so
      //  either the adapter or the labware are rendered but not both
      const topLabwareDefinition =
        labwareInAdapter?.result?.definition ?? labwareDef
      const topLabwareId = labwareInAdapter?.result?.labwareId ?? labwareId
      const isLabwareInStack = protocolAnalysis?.commands.some(
        command =>
          command.commandType === 'loadLabware' &&
          command.result?.labwareId === labwareId &&
          typeof command.params.location === 'object' &&
          ('moduleId' in command.params.location ||
            'labwareId' in command.params.location)
      )

      return {
        definition: labwareDef,
        labwareLocation: location,
        wellFill: getWellFillFromLabwareId(
          labwareId,
          protocolAnalysis.liquids,
          labwareByLiquidId
        ),
        labwareChildren: showLabwareInfo ? (
          <LabwareInfo def={labwareDef}>
            {labwareNickName ?? getLabwareDisplayName(labwareDef)}
          </LabwareInfo>
        ) : null,
        highlight: handleLabwareClick != null,
        onLabwareClick:
          handleLabwareClick != null
            ? () => {
                handleLabwareClick(topLabwareDefinition, topLabwareId)
              }
            : undefined,
        stacked: handleLabwareClick != null && isLabwareInStack,
      }
    }
  )

  return (
    <BaseDeck
      deckConfig={deckConfig}
      deckLayerBlocklist={getStandardDeckViewLayerBlockList(robotType)}
      robotType={robotType}
      labwareOnDeck={labwareOnDeck}
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
