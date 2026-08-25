import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
} from '@opentrons/components'

import { Skeleton } from '/app/atoms/Skeleton'

import { PlayPauseButton } from '../shared/PlayPauseButton'
import { StopButton } from '../shared/StopButton'

import type { ReactNode } from 'react'
// eslint-disable-next-line opentrons/no-imports-up-the-tree-of-life
import type { ScreenOption } from '/app/pages/ODD/RunningProtocol'

const CURRENT_RUNNING_PROTOCOL_COMMAND_SIZE = '99rem' // CurrentRunningProtocolCommand screen
const RUNNING_PROTOCOL_COMMAND_LIST_SIZE = '389rem' // RunningProtocolCommandList screen

interface RunningProtocolSkeletonProps {
  currentOption: ScreenOption
}

export function RunningProtocolSkeleton({
  currentOption,
}: RunningProtocolSkeletonProps): ReactNode {
  return (
    <>
      {currentOption === 'CurrentRunningProtocolCommand' ? (
        <>
          <Flex
            flexDirection={DIRECTION_ROW}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
          >
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
              <Skeleton
                width="6.9375rem"
                height="2rem"
                backgroundSize={CURRENT_RUNNING_PROTOCOL_COMMAND_SIZE}
              />
              <Skeleton
                width="27.5rem"
                height="2rem"
                backgroundSize={CURRENT_RUNNING_PROTOCOL_COMMAND_SIZE}
              />
            </Flex>
            <Skeleton
              width="9.625rem"
              height="2.625rem"
              backgroundSize={CURRENT_RUNNING_PROTOCOL_COMMAND_SIZE}
            />
          </Flex>

          <Flex
            flexDirection={DIRECTION_ROW}
            gridGap={SPACING.spacing32}
            justifyContent={JUSTIFY_CENTER}
            alignItems={ALIGN_CENTER}
            marginBottom={SPACING.spacing40}
          >
            <StopButton />
            <PlayPauseButton />
          </Flex>
          <Skeleton
            width="54.375rem"
            height="3.25rem"
            backgroundSize={CURRENT_RUNNING_PROTOCOL_COMMAND_SIZE}
          />
        </>
      ) : (
        <>
          <Flex
            flexDirection={DIRECTION_ROW}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            marginBottom={SPACING.spacing40}
          >
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
              <Skeleton
                width="6.9375rem"
                height="2rem"
                backgroundSize={RUNNING_PROTOCOL_COMMAND_LIST_SIZE}
              />
              <Skeleton
                width="27.5rem"
                height="2rem"
                backgroundSize={RUNNING_PROTOCOL_COMMAND_LIST_SIZE}
              />
            </Flex>
            <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing16}>
              <StopButton buttonSize="6.25rem" iconSize="5rem" />
              <PlayPauseButton buttonSize="6.25rem" iconSize="2.5rem" />
            </Flex>
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
            <Skeleton
              width="59rem"
              height="3.25rem"
              backgroundSize={RUNNING_PROTOCOL_COMMAND_LIST_SIZE}
            />
            <Skeleton
              width="59rem"
              height="3.25rem"
              backgroundSize={RUNNING_PROTOCOL_COMMAND_LIST_SIZE}
            />
            <Skeleton
              width="59rem"
              height="3.25rem"
              backgroundSize={RUNNING_PROTOCOL_COMMAND_LIST_SIZE}
            />
            <Skeleton
              width="59rem"
              height="3.25rem"
              backgroundSize={RUNNING_PROTOCOL_COMMAND_LIST_SIZE}
            />
            <Skeleton
              width="59rem"
              height="3.25rem"
              backgroundSize={RUNNING_PROTOCOL_COMMAND_LIST_SIZE}
            />
            <Skeleton
              width="59rem"
              height="3.25rem"
              backgroundSize={RUNNING_PROTOCOL_COMMAND_LIST_SIZE}
            />
          </Flex>
        </>
      )}
    </>
  )
}
