import * as React from 'react'
import {
  Flex,
  JUSTIFY_SPACE_AROUND,
  JUSTIFY_FLEX_START,
  ALIGN_CENTER,
} from '@opentrons/components'
import type { RobotType, RunTimeCommand } from '@opentrons/shared-data'
import { CommandText } from './CommandText'
import type { CommandTextData } from './types'

export type CommandState = 'current' | 'failed' | 'future' | 'loading'

export interface CommandProps {
  state: CommandState
  aligned: 'left' | 'center'
  command: RunTimeCommand
  commandTextData: CommandTextData
  robotType: RobotType
  isOnDevice?: boolean
}

export function Command(props: CommandProps): JSX.Element {
  return props.aligned === 'left' ? (
    <LeftAlignedCommand {...props} />
  ) : (
    <CenteredCommand {...props} />
  )
}

export function CenteredCommand(
  props: Omit<CommandProps, 'aligned'>
): JSX.Element {
  return (
    <Flex justifyContent={JUSTIFY_SPACE_AROUND} alignContent={ALIGN_CENTER}>
      <CommandText {...props} />
    </Flex>
  )
}

export function LeftAlignedCommand(
  props: Omit<CommandProps, 'aligned'>
): JSX.Element {
  return (
    <Flex justifyContent={JUSTIFY_FLEX_START} alignContent={ALIGN_CENTER}>
      <CommandText {...props} />
    </Flex>
  )
}
