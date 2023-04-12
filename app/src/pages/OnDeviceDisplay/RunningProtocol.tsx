import * as React from 'react'
import { useParams, Link } from 'react-router-dom'
import styled from 'styled-components'

import { RUN_STATUS_FAILED } from '@opentrons/api-client'
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
  ALIGN_FLEX_END,
} from '@opentrons/components'
import {
  useProtocolQuery,
  useRunQuery,
  useRunActionMutations,
} from '@opentrons/react-api-client'
import { RunTimeCommand } from '@opentrons/shared-data'

import { TertiaryButton } from '../../atoms/buttons'
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
  RunningProtocolSkeleton,
  RunFailedModal,
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
  const [showRunFailedModal, setShowRunFailedModal] = React.useState<boolean>(
    false
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

  const errors = runRecord?.data.errors
  const failedCommand = robotSideAnalysis?.commands.find(
    (c: RunTimeCommand, index: number) => index === currentRunCommandIndex
  )

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

  React.useEffect(() => {
    if (runStatus === RUN_STATUS_FAILED) {
      setShowRunFailedModal(true)
    }
  }, [runStatus])

  return (
    <>
      {showRunFailedModal ? (
        <RunFailedModal
          runId={runId}
          setShowRunFailedModal={setShowRunFailedModal}
          failedStep={currentRunCommandIndex}
          failedCommand={failedCommand}
          errors={errors}
        />
      ) : null}
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
            <RunningProtocolSkeleton currentOption={currentOption} />
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
      {/* temporary */}
      <Flex
        alignSelf={ALIGN_FLEX_END}
        marginTop={SPACING.spacing5}
        width="fit-content"
        paddingRight={SPACING.spacing6}
      >
        <Link to="/dashboard">
          <TertiaryButton>back to RobotDashboard</TertiaryButton>
        </Link>
      </Flex>
    </>
  )
}
