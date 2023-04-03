import * as React from 'react'

import {
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  SPACING,
} from '@opentrons/components'

import {
  PlayPauseButton,
  SmallPlayPauseButton,
  SmallStopButton,
  StopButton,
} from './Buttons'
import { Skeleton } from '../../../atoms/Skeleton'

import type { ScreenOption } from '../../../pages/OnDeviceDisplay/RunningProtocol'

const LEFT_BACKGROUND_SIZE = '99rem' // CurrentRunningProtocolCommand screen
const RIGHT_BACKGROUND_SIZE = '389rem' // RunningProtocolCommandList screen

interface RunningProtocolSkeltonProps {
  currentOption: ScreenOption
}

export function RunningProtocolSkelton({
  currentOption,
}: RunningProtocolSkeltonProps): JSX.Element {
  return (
    <>
      {currentOption === 'CurrentRunningProtocolCommand' ? (
        <>
          <Flex
            flexDirection={DIRECTION_ROW}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
          >
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing3}>
              <Skeleton
                width="6.9375rem"
                height="2rem"
                backgroundSize={LEFT_BACKGROUND_SIZE}
              />
              <Skeleton
                width="27.5rem"
                height="2rem"
                backgroundSize={LEFT_BACKGROUND_SIZE}
              />
            </Flex>
            <Skeleton
              width="9.625rem"
              height="2.625rem"
              backgroundSize={LEFT_BACKGROUND_SIZE}
            />
          </Flex>

          <Flex
            flexDirection={DIRECTION_ROW}
            gridGap={SPACING.spacing6}
            justifyContent={JUSTIFY_CENTER}
            alignItems={ALIGN_CENTER}
            marginBottom={SPACING.spacingXXL}
          >
            <StopButton />
            <PlayPauseButton />
          </Flex>
          <Skeleton
            width="54.375rem"
            height="3.25rem"
            backgroundSize={LEFT_BACKGROUND_SIZE}
          />
        </>
      ) : (
        <>
          <Flex
            flexDirection={DIRECTION_ROW}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            marginBottom={SPACING.spacingXXL}
          >
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing3}>
              <Skeleton
                width="6.9375rem"
                height="2rem"
                backgroundSize={RIGHT_BACKGROUND_SIZE}
              />
              <Skeleton
                width="27.5rem"
                height="2rem"
                backgroundSize={RIGHT_BACKGROUND_SIZE}
              />
            </Flex>
            <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing4}>
              <SmallStopButton />
              <SmallPlayPauseButton />
            </Flex>
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing3}>
            <Skeleton
              width="59rem"
              height="3.25rem"
              backgroundSize={RIGHT_BACKGROUND_SIZE}
            />
            <Skeleton
              width="59rem"
              height="3.25rem"
              backgroundSize={RIGHT_BACKGROUND_SIZE}
            />
            <Skeleton
              width="59rem"
              height="3.25rem"
              backgroundSize={RIGHT_BACKGROUND_SIZE}
            />
            <Skeleton
              width="59rem"
              height="3.25rem"
              backgroundSize={RIGHT_BACKGROUND_SIZE}
            />
            <Skeleton
              width="59rem"
              height="3.25rem"
              backgroundSize={RIGHT_BACKGROUND_SIZE}
            />
            <Skeleton
              width="59rem"
              height="3.25rem"
              backgroundSize={RIGHT_BACKGROUND_SIZE}
            />
          </Flex>
        </>
      )}
    </>
  )
}
