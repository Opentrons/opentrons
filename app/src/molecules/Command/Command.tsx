import * as React from 'react'
import {
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_FLEX_START,
  ALIGN_CENTER,
  COLORS,
  BORDERS,
  TYPOGRAPHY,
  SPACING,
} from '@opentrons/components'
import type { RobotType, RunTimeCommand } from '@opentrons/shared-data'
import { CommandText, CommandIcon } from '.'
import type { CommandTextData } from './types'
import { Skeleton } from '../../atoms/Skeleton'
import type { StyleProps } from '@opentrons/components'

export type CommandState = NonSkeletonCommandState | 'loading'
type NonSkeletonCommandState = 'current' | 'failed' | 'future'

interface FundamentalProps {
  robotType: RobotType
  isOnDevice?: boolean
  aligned: 'left' | 'center'
}

interface SkeletonCommandProps extends FundamentalProps {
  state: 'loading'
  command: any
  commandTextData: any
}

interface NonSkeletonCommandProps extends FundamentalProps {
  state: NonSkeletonCommandState
  command: RunTimeCommand
  commandTextData: CommandTextData
}

export type CommandProps = SkeletonCommandProps | NonSkeletonCommandProps

export function Command(props: CommandProps): JSX.Element {
  return props.state === 'loading' ? (
    <Skeleton width="100%" height="2rem" backgroundSize="47rem" />
  ) : props.aligned === 'left' ? (
    <LeftAlignedCommand {...props} />
  ) : (
    <CenteredCommand {...props} />
  )
}

const ICON_SIZE = SPACING.spacing32 as const
const UNIVERSAL_CONTAINER_STYLES = {
  borderRadius: BORDERS.borderRadius8,
  paddingX: SPACING.spacing24,
  paddingY: SPACING.spacing12,
} as const

const UNIVERSAL_ICON_STYLES = {
  size: ICON_SIZE,
  marginRight: SPACING.spacing12,
} as const

const PROPS_BY_STATE: Record<
  NonSkeletonState,
  { container: StyleProps; icon: StyleProps }
> = {
  current: {
    container: {
      backgroundColor: COLORS.blue35,
      ...UNIVERSAL_CONTAINER_STYLES,
    },
    icon: {
      ...UNIVERSAL_ICON_STYLES,
    },
  },
  failed: {
    container: {
      backgroundColor: COLORS.red35,
      ...UNIVERSAL_CONTAINER_STYLES,
    },
    icon: {
      ...UNIVERSAL_ICON_STYLES,
    },
  },
  future: {
    container: {
      backgroundColor: COLORS.grey35,
      ...UNIVERSAL_CONTAINER_STYLES,
    },
    icon: {
      ...UNIVERSAL_ICON_STYLES,
    },
  },
}

export function CenteredCommand(
  props: Omit<NonSkeletonCommandProps, 'aligned'>
): JSX.Element {
  return (
    <Flex
      justifyContent={JUSTIFY_CENTER}
      alignItems={ALIGN_CENTER}
      {...PROPS_BY_STATE[props.state].container}
    >
      <CommandIcon
        command={props.command}
        {...PROPS_BY_STATE[props.state].icon}
      />
      <Flex minHeight={ICON_SIZE} alignItems={ALIGN_CENTER}>
        <CommandText {...props} />
      </Flex>
    </Flex>
  )
}

export function LeftAlignedCommand(
  props: Omit<NonSkeletonCommandProps, 'aligned'>
): JSX.Element {
  return (
    <Flex
      justifyContent={JUSTIFY_FLEX_START}
      alignItems={ALIGN_CENTER}
      {...PROPS_BY_STATE[props.state].container}
    >
      <CommandIcon
        command={props.command}
        {...PROPS_BY_STATE[props.state].icon}
      />
      <Flex minHeight={ICON_SIZE} alignItems={ALIGN_CENTER}>
        <CommandText {...props} />
      </Flex>
    </Flex>
  )
}
