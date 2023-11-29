import * as React from 'react'

import { BaseDeck } from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { getStandardDeckViewLayerBlockList, getSimplestDeckConfigForProtocolCommands } from './utils'

import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import { getLabwareOnDeck } from './utils/getLabwareOnDeck'
import { getModulesOnDeck } from './utils/getModulesOnDeck'

interface ProtocolDeckProps {
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput | null
  /** extra props to pass through to BaseDeck component */
  baseDeckProps?: React.ComponentProps<typeof BaseDeck>
}

export function ProtocolDeck(props: ProtocolDeckProps): JSX.Element | null {
  const { protocolAnalysis, baseDeckProps } = props

  if (protocolAnalysis == null || protocolAnalysis.errors.length > 0) return null

  const robotType = protocolAnalysis.robotType ?? FLEX_ROBOT_TYPE
  const deckConfig = getSimplestDeckConfigForProtocolCommands(protocolAnalysis.commands)

  return (
    <BaseDeck
      deckConfig={deckConfig}
      deckLayerBlocklist={getStandardDeckViewLayerBlockList(robotType)}
      robotType={robotType}
      labwareLocations={getLabwareOnDeck(protocolAnalysis)}
      moduleLocations={getModulesOnDeck(protocolAnalysis)}
      {...baseDeckProps}
    />
  )
}
