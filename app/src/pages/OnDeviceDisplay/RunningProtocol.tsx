import * as React from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'

import {
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  SPACING,
  useSwipe,
  COLORS,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  POSITION_RELATIVE,
  OVERFLOW_HIDDEN,
} from '@opentrons/components'
import {
  useProtocolQuery,
  useRunQuery,
  useRunActionMutations,
} from '@opentrons/react-api-client'

import { StepMeter } from '../../atoms/StepMeter'
import { useMostRecentCompletedAnalysis } from '../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useLastRunCommandKey } from '../../organisms/Devices/hooks/useLastRunCommandKey'
import {
  useRunStatus,
  useRunTimestamps,
} from '../../organisms/RunTimeControl/hooks'
import {
  CurrentRunningProtocolCommand,
  RunningProtocolCommandList,
  RunningProtocolSkelton,
} from '../../organisms/OnDeviceDisplay/RunningProtocol'
import { useTrackProtocolRunEvent } from '../../organisms/Devices/hooks'

import type { OnDeviceRouteParams } from '../../App/types'

interface BulletProps {
  isActive: boolean
}
const Bullet = styled.div`
  height: 0.5rem;
  width: 0.5rem;
  border-radius: 50%;
  z-index: 10;
  background: ${(props: BulletProps) =>
    props.isActive ? COLORS.darkBlack_sixty : COLORS.darkBlack_forty};
  transform: ${(props: BulletProps) =>
    props.isActive ? 'scale(2)' : 'scale(1)'};
`

export type ScreenOption =
  | 'CurrentRunningProtocolCommand'
  | 'RunningProtocolCommandList'

export function RunningProtocol(): JSX.Element {
  const { runId } = useParams<OnDeviceRouteParams>()
  const [currentOption, setCurrentOption] = React.useState<ScreenOption>(
    'CurrentRunningProtocolCommand'
  )
  const swipe = useSwipe()
  const robotSideAnalysis = useMostRecentCompletedAnalysis(runId)
  const currentRunCommandKey = useLastRunCommandKey(runId)
  const totalIndex = robotSideAnalysis?.commands.length
  const currentRunCommandIndex = robotSideAnalysis?.commands.findIndex(
    c => c.key === currentRunCommandKey
  )
  const runStatus = useRunStatus(runId)
  const { startedAt, stoppedAt, completedAt } = useRunTimestamps(runId)
  const { data: runRecord } = useRunQuery(runId, { staleTime: Infinity })
  const protocolId = runRecord?.data.protocolId ?? null
  const { data: protocolRecord } = useProtocolQuery(protocolId, {
    staleTime: Infinity,
  })
  const protocolName =
    protocolRecord?.data.metadata.protocolName ??
    protocolRecord?.data.files[0].name
  const { playRun, pauseRun, stopRun } = useRunActionMutations(runId)
  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId)

  React.useEffect(() => {
    if (
      currentOption === 'CurrentRunningProtocolCommand' &&
      swipe.swipeType === 'swipe-left'
    ) {
      setCurrentOption('RunningProtocolCommandList')
      swipe.setSwipeType('')
    }

    if (
      currentOption === 'RunningProtocolCommandList' &&
      swipe.swipeType === 'swipe-right'
    ) {
      setCurrentOption('CurrentRunningProtocolCommand')
      swipe.setSwipeType('')
    }
  }, [currentOption, swipe, swipe.setSwipeType])

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      position={POSITION_RELATIVE}
      overflow={OVERFLOW_HIDDEN}
    >
      {robotSideAnalysis != null ? (
        <StepMeter
          totalSteps={totalIndex != null ? totalIndex : 0}
          currentStep={
            currentRunCommandIndex != null
              ? Number(currentRunCommandIndex) + 1
              : 1
          }
          OnDevice
        />
      ) : null}
      <Flex
        ref={swipe.ref}
        padding={`1.75rem ${SPACING.spacingXXL} ${SPACING.spacingXXL}`}
        flexDirection={DIRECTION_COLUMN}
      >
        {robotSideAnalysis != null ? (
          currentOption === 'CurrentRunningProtocolCommand' ? (
            <CurrentRunningProtocolCommand
              playRun={playRun}
              pauseRun={pauseRun}
              stopRun={stopRun}
              trackProtocolRunEvent={trackProtocolRunEvent}
              protocolName={protocolName}
              runStatus={runStatus}
              currentRunCommandIndex={currentRunCommandIndex}
              robotSideAnalysis={robotSideAnalysis}
              runTimerInfo={{ runStatus, startedAt, stoppedAt, completedAt }}
            />
          ) : (
            <RunningProtocolCommandList
              protocolName={protocolName}
              runStatus={runStatus}
              playRun={playRun}
              pauseRun={pauseRun}
              stopRun={stopRun}
              trackProtocolRunEvent={trackProtocolRunEvent}
              currentRunCommandIndex={currentRunCommandIndex}
              robotSideAnalysis={robotSideAnalysis}
            />
          )
        ) : (
          <RunningProtocolSkelton currentOption={currentOption} />
        )}
        <Flex
          marginTop="2rem"
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing4}
          justifyContent={JUSTIFY_CENTER}
          alignItems={ALIGN_CENTER}
        >
          <Bullet
            isActive={currentOption === 'CurrentRunningProtocolCommand'}
          />
          <Bullet isActive={currentOption === 'RunningProtocolCommandList'} />
        </Flex>
      </Flex>
    </Flex>
  )
}
