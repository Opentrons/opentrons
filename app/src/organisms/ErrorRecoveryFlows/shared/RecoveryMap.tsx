import * as React from 'react'
import { css } from 'styled-components'

import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import {
  BaseDeck,
  Box,
  RobotCoordsForeignDiv,
  COLORS,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  JUSTIFY_FLEX_END,
} from '@opentrons/components'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { RecoveryContentProps } from '../types'

export function RecoveryMap({
  isOnDevice,
  recoveryMapUtils,
}: RecoveryContentProps): JSX.Element | null {
  const { deckConfig, runCurrentModules, runCurrentLabware } = recoveryMapUtils

  if (isOnDevice) {
    return (
      <BaseDeck
        deckConfig={deckConfig}
        robotType={FLEX_ROBOT_TYPE}
        modulesOnDeck={runCurrentModules}
        labwareOnDeck={runCurrentLabware}
      />
    )
  } else {
    return null
  }
}

export function LabwareHighlight({
  highlight,
  definition,
}: {
  highlight: boolean
  definition: LabwareDefinition2
}): JSX.Element {
  const width = definition.dimensions.xDimension
  const height = definition.dimensions.yDimension

  return (
    <RobotCoordsForeignDiv
      x={definition.cornerOffsetFromSlot.x}
      y={definition.cornerOffsetFromSlot.y}
      {...{ width, height }}
      innerDivProps={{
        display: DISPLAY_FLEX,
        flexDirection: DIRECTION_COLUMN,
        justifyContent: JUSTIFY_FLEX_END,
        width: '100%',
        height: '100%',
      }}
    >
      <Box
        width="100%"
        height="100%"
        css={highlight ? HIGHLIGHT_STYLE : undefined}
      />
    </RobotCoordsForeignDiv>
  )
}

const HIGHLIGHT_STYLE = css`
  border-radius: 7.04px;
  border: 3px solid ${COLORS.blue50};
  box-shadow: 0 0 4px 3px #74b0ff;
`
