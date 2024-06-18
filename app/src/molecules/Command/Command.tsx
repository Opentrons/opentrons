import * as React from 'react'
import {
  Flex,
  Box,
  JUSTIFY_CENTER,
  JUSTIFY_FLEX_START,
  ALIGN_CENTER,
  COLORS,
  BORDERS,
  SPACING,
  RESPONSIVENESS,
} from '@opentrons/components'
import type { RobotType, RunTimeCommand } from '@opentrons/shared-data'
import { CommandText } from './CommandText'
import { CommandIcon } from './CommandIcon'
import type { CommandTextData } from './types'
import { Skeleton } from '../../atoms/Skeleton'
import type { StyleProps } from '@opentrons/components'
import { omit } from 'lodash'

export type CommandState = NonSkeletonCommandState | 'loading'
type NonSkeletonCommandState = 'current' | 'failed' | 'future'

interface FundamentalProps {
  robotType: RobotType
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
  // This uses the dynamic function variant to work with storybook
  const isOnDevice = RESPONSIVENESS.isTouchscreenDynamic()
  return props.state === 'loading' ? (
    <Skeleton width="100%" height={SKELETON_HEIGHT} backgroundSize="47rem" />
  ) : props.aligned === 'left' ? (
    <LeftAlignedCommand {...props} isOnDevice={isOnDevice} />
  ) : (
    <CenteredCommand {...props} isOnDevice={isOnDevice} />
  )
}

const ICON_SIZE = SPACING.spacing32
const CONTAINER_Y_PADDING = SPACING.spacing12
const SKELETON_HEIGHT = '3.5rem' // spacing32 + spacing12 + spacing12, not otherwise a constant
const UNIVERSAL_CONTAINER_STYLES = {
  borderRadius: BORDERS.borderRadius8,
  paddingX: SPACING.spacing24,
  paddingY: CONTAINER_Y_PADDING,
} as const

const UNIVERSAL_ICON_STYLES = {
  size: ICON_SIZE,
  marginRight: SPACING.spacing12,
} as const

const PROPS_BY_STATE: Record<
  NonSkeletonCommandState,
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
  props: Omit<NonSkeletonCommandProps, 'aligned'> & { isOnDevice: boolean }
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
      <Box minHeight={ICON_SIZE} alignItems={ALIGN_CENTER} width="100%">
        <CommandText
          {...props}
          css={`
            @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
              display: -webkit-box;
              -webkit-box-orient: vertical;
              overflow: hidden;
              text-overflow: ellipsis;
              word-wrap: break-word;
              -webkit-line-clamp: 2;
            }
            @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
              max-height: 240px;
              overflow: auto;
            } ;
          `}
        />
      </Box>
    </Flex>
  )
}

export function LeftAlignedCommand(
  props: Omit<NonSkeletonCommandProps, 'aligned'> & { isOnDevice: boolean }
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
      <Box minHeight={ICON_SIZE} alignItems={ALIGN_CENTER} width="100%">
        <CommandText
          {...omit(props, ['isOnDevice'])}
          css={`
            @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
              display: -webkit-box;
              -webkit-box-orient: vertical;
              -webkit-line-clamp: 14;
              overflow: hidden;
              text-overflow: ellipsis;
              word-wrap: break-word;
            }
            @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
              max-height: 240px;
              overflow: auto;
            } ;
          `}
        />
      </Box>
    </Flex>
  )
}
