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
} from '../../organisms/OnDeviceDisplay/RunningProtocol'

import type { OnDeviceRouteParams } from '../../App/types'

interface BulletProps {
  isActive: boolean
}
const Bullet = styled.div`
  height: 1rem;
  width: 1rem;
  border-radius: 50%;
  background: ${(props: BulletProps) =>
    props.isActive ? COLORS.darkBlack_sixty : COLORS.darkBlack_fourty};
  transform: ${(props: BulletProps) =>
    props.isActive ? 'scale(2)' : 'scale(1)'};
`

type ScreenOption =
  | 'CurrentRunningProtocolCommand'
  | 'RunningProtocolCommandList'

export function RunningProtocol(): JSX.Element {
  const { runId } = useParams<OnDeviceRouteParams>()
  const [currentOption, setCurrentOption] = React.useState<ScreenOption | null>(
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

  const {
    playRun,
    pauseRun,
    stopRun,
    isPlayRunActionLoading,
    isPauseRunActionLoading,
    isStopRunActionLoading,
  } = useRunActionMutations(runId)
  // console.log('commands', robotSideAnalysis?.commands)

  // console.log('currentRunCommandIndex', currentRunCommandIndex)
  console.log(
    'currentRun',
    currentRunCommandIndex != null &&
      robotSideAnalysis?.commands[currentRunCommandIndex]
  )

  console.log('totalSteps', totalIndex)
  console.log('currentRunCommandIndex', currentRunCommandIndex)

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
    <>
      <StepMeter
        totalSteps={totalIndex != null ? totalIndex : 0}
        currentStep={
          currentRunCommandIndex != null
            ? Number(currentRunCommandIndex) + 1
            : 1
        }
        OnDevice
      />
      <Flex
        ref={swipe.ref}
        padding={`1.75rem ${SPACING.spacingXXL} ${SPACING.spacingXXL}`}
        flexDirection={DIRECTION_COLUMN}
      >
        {currentOption === 'CurrentRunningProtocolCommand' ? (
          <CurrentRunningProtocolCommand
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
            currentRunCommandIndex={currentRunCommandIndex}
            robotSideAnalysis={robotSideAnalysis}
          />
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
    </>
  )
}
