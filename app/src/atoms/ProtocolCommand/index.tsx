import * as React from 'react'
import {
  Flex,
  JUSTIFY_SPACE_AROUND,
  JUSTIFY_FLEX_START,
  ALIGN_CENTER,
} from '@opentrons/components'
import type { RobotType, RunTimeCommand } from '@opentrons/shared-data'
import { CommandText } from '../../organisms/CommandText'
import type { CommandTextData } from '../../organisms/CommandText'

export type ProtocolCommandState = 'current' | 'failed' | 'future' | 'loading'

export interface ProtocolCommandProps {
  state: ProtocolCommandState
  aligned: 'left' | 'center'
  command: RunTimeCommand
  commandTextData: CommandTextData
  robotType: RobotType
  isOnDevice?: boolean
}

export function ProtocolCommand(props: ProtocolCommandProps): JSX.Element {
  return props.aligned === 'left' ? (
    <LeftAlignedProtocolCommand {...props} />
  ) : (
    <CenteredProtocolCommand {...props} />
  )
}

export function CenteredProtocolCommand(
  props: Omit<ProtocolCommandProps, ['aligned']>
): JSX.Element {
  return (
    <Flex
      justifyContent={JUSTIFY_SPACE_AROUND}
      alignContent={ALIGN_CENTER}
    >
      <CommandText {...props} />
    </Flex>
  )
}

export function LeftAlignedProtocolCommand(
  props: Omit<ProtocolCommandProps, ['aligned']>
): JSX.Element {
  return (
    <Flex
      justifyContent={JUSTIFY_FLEX_START}
      alignContent={ALIGN_CENTER}
    >
      <CommandText {...props} />
    </Flex>
  )
}
