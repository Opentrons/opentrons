import * as React from 'react'
import {
  FLEX_ROBOT_TYPE,
  getLabwareDisplayName,
  getSimplestDeckConfigForProtocol,
} from '@opentrons/shared-data'

import { BaseDeck } from '../BaseDeck'
import { getStandardDeckViewLayerBlockList } from './utils'
import { getTopMostLabwareInSlots } from './utils/getLabwareInSlots'
import { getModulesInSlots } from './utils/getModulesInSlots'

import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import { LabwareInfo } from './LabwareInfo'
import { getLabwareInfoByLiquidId } from './utils/getLabwareInfoByLiquidId'
import { getWellFillFromLabwareId } from './utils/getWellFillFromLabwareId'

export * from './utils/getStandardDeckViewLayerBlockList'

interface ProtocolDeckProps {
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput | null
  /** defaults to false, when set labware nicknames will appear on top level labware. If no nickname specified in protocol, falls back to labware definition display name */
  showLabwareInfo?: boolean
  /** extra props to pass through to BaseDeck component */
  baseDeckProps?: Partial<React.ComponentProps<typeof BaseDeck>>
}

export function ProtocolDeck(props: ProtocolDeckProps): JSX.Element | null {
  const { protocolAnalysis, baseDeckProps, showLabwareInfo = false } = props

  if (protocolAnalysis == null || (protocolAnalysis?.errors ?? []).length > 0)
    return null

  const robotType = protocolAnalysis.robotType ?? FLEX_ROBOT_TYPE
  const deckConfig = getSimplestDeckConfigForProtocol(protocolAnalysis)
  const labwareByLiquidId = getLabwareInfoByLiquidId(protocolAnalysis.commands)

  const modulesInSlots = getModulesInSlots(protocolAnalysis)
  const modulesOnDeck = modulesInSlots.map(
    ({
      moduleModel,
      moduleLocation,
      nestedLabwareId,
      nestedLabwareDef,
      nestedLabwareNickName,
    }) => ({
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
    })
  )

  const topMostLabwareInSlots = getTopMostLabwareInSlots(protocolAnalysis)
  const labwareOnDeck = topMostLabwareInSlots.map(
    ({ labwareId, labwareDef, labwareNickName, location }) => ({
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
    })
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
