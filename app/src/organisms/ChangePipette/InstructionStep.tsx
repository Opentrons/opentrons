import * as React from 'react'
import { Box, Flex, JUSTIFY_SPACE_EVENLY, SPACING } from '@opentrons/components'
import type {
  PipetteChannels,
  PipetteDisplayCategory,
} from '@opentrons/shared-data'
import type { Mount } from '@opentrons/components'
import type { Diagram, Direction } from './types'

interface Props {
  children: React.ReactNode
  direction: Direction
  mount: Mount
  channels: PipetteChannels
  diagram: Diagram
  displayCategory: PipetteDisplayCategory | null
}

export function InstructionStep(props: Props): JSX.Element {
  const {
    children,
    channels,
    diagram,
    displayCategory,
    mount,
    direction,
  } = props
  const channelsKey = channels === 8 ? 'multi' : 'single'

  const display =
    displayCategory === 'GEN2'
      ? require(`../../assets/images/change-pip/${direction}-${mount}-${channelsKey}-GEN2-${diagram}@3x.png`)
      : require(`../../assets/images/change-pip/${direction}-${mount}-${channelsKey}-${diagram}@3x.png`)

  return (
    <Flex justifyContent={JUSTIFY_SPACE_EVENLY}>
      <Box marginRight={SPACING.spacingXXL} width="18.6875rem">
        {children}
      </Box>
      <Box
        marginTop={diagram === 'tab' ? '4.1875rem' : '0.75rem'}
        marginLeft={diagram === 'tab' ? '1.5625rem' : SPACING.spacingXXL}
        marginRight={SPACING.spacing6}
      >
        <img
          src={display}
          height={diagram === 'tab' ? '100%' : '245px'}
          width={diagram === 'tab' ? '240px' : '200px'}
          alt={`${direction}-${mount}-${channelsKey}-${displayCategory}-${diagram}`}
        />
      </Box>
    </Flex>
  )
}
