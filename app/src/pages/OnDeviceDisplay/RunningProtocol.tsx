import * as React from 'react'
import { useParams, Link } from 'react-router-dom'
import styled from 'styled-components'
import { useSelector } from 'react-redux'

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
import { RUN_STATUS_STOP_REQUESTED } from '@opentrons/api-client'
import { TertiaryButton } from '../../atoms/buttons'
import { StepMeter } from '../../atoms/StepMeter'
import { useMostRecentCompletedAnalysis } from '../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useLastRunCommandKey } from '../../organisms/Devices/hooks/useLastRunCommandKey'
import { InterventionModal } from '../../organisms/InterventionModal'
import { isInterventionCommand } from '../../organisms/InterventionModal/utils'
import {
  useRunStatus,
  useRunTimestamps,
} from '../../organisms/RunTimeControl/hooks'
import {
  CurrentRunningProtocolCommand,
  RunningProtocolCommandList,
  RunningProtocolSkeleton,
} from '../../organisms/OnDeviceDisplay/RunningProtocol'
import {
  useTrackProtocolRunEvent,
  useRobotAnalyticsData,
} from '../../organisms/Devices/hooks'
import { CancelingRunModal } from '../../organisms/OnDeviceDisplay/RunningProtocol/CancelingRunModal'
import { ConfirmCancelRunModal } from '../../organisms/OnDeviceDisplay/RunningProtocol/ConfirmCancelRunModal'
import { getLocalRobot } from '../../redux/discovery'

import type { RunTimeCommand } from '@opentrons/shared-data'
import type { OnDeviceRouteParams } from '../../App/types'

const RUN_STATUS_REFETCH_INTERVAL = 5000
interface BulletProps {
  isActive: boolean
}
const Bullet = styled.div`
  height: 0.5rem;
  width: 0.5rem;
  border-radius: 50%;
  z-index: 2;
  background: ${(props: BulletProps) =>
    props.isActive ? COLORS.darkBlack60 : COLORS.darkBlack40};
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
  const [
    showConfirmCancelRunModal,
    setShowConfirmCancelRunModal,
  ] = React.useState<boolean>(false)
  const [
    interventionModalCommandKey,
    setInterventionModalCommandKey,
  ] = React.useState<string | null>(null)
  const lastAnimatedCommand = React.useRef<string | null>(null)
  const swipe = useSwipe()
  const robotSideAnalysis = useMostRecentCompletedAnalysis(runId)
  const currentRunCommandKey = useLastRunCommandKey(runId)
  const totalIndex = robotSideAnalysis?.commands.length
  const currentRunCommandIndex = robotSideAnalysis?.commands.findIndex(
    c => c.key === currentRunCommandKey
  )
  const runStatus = useRunStatus(runId, {
    refetchInterval: RUN_STATUS_REFETCH_INTERVAL,
  })
  const { startedAt, stoppedAt, completedAt } = useRunTimestamps(runId)
  const { data: runRecord } = useRunQuery(runId, { staleTime: Infinity })
  const protocolId = runRecord?.data.protocolId ?? null
  const { data: protocolRecord } = useProtocolQuery(protocolId, {
    staleTime: Infinity,
  })
  const protocolName =
    protocolRecord?.data.metadata.protocolName ??
    protocolRecord?.data.files[0].name
  const { playRun, pauseRun } = useRunActionMutations(runId)
  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId)
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot != null ? localRobot.name : 'no name'
  const robotAnalyticsData = useRobotAnalyticsData(robotName)
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

  const currentCommand = robotSideAnalysis?.commands.find(
    (c: RunTimeCommand, index: number) => index === currentRunCommandIndex
  )

  React.useEffect(() => {
    if (
      currentCommand != null &&
      interventionModalCommandKey != null &&
      currentCommand.key !== interventionModalCommandKey
    ) {
      // set intervention modal command key to null if different from current command key
      setInterventionModalCommandKey(null)
    } else if (
      currentCommand?.key != null &&
      isInterventionCommand(currentCommand) &&
      interventionModalCommandKey === null
    ) {
      setInterventionModalCommandKey(currentCommand.key)
    }
  }, [currentCommand, interventionModalCommandKey])

  return (
    <>
      {runStatus === RUN_STATUS_STOP_REQUESTED ? <CancelingRunModal /> : null}

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
          />
        ) : null}
        {showConfirmCancelRunModal ? (
          <ConfirmCancelRunModal
            runId={runId}
            setShowConfirmCancelRunModal={setShowConfirmCancelRunModal}
            isActiveRun={true}
          />
        ) : null}
        {interventionModalCommandKey != null &&
        runRecord?.data != null &&
        currentCommand != null ? (
          <InterventionModal
            robotName={robotName}
            command={currentCommand}
            onResume={playRun}
            run={runRecord.data}
            analysis={robotSideAnalysis}
          />
        ) : null}
        <Flex
          ref={swipe.ref}
          padding={`1.75rem ${SPACING.spacing40} ${SPACING.spacing40}`}
          flexDirection={DIRECTION_COLUMN}
        >
          {robotSideAnalysis != null ? (
            currentOption === 'CurrentRunningProtocolCommand' ? (
              <CurrentRunningProtocolCommand
                playRun={playRun}
                pauseRun={pauseRun}
                setShowConfirmCancelRunModal={setShowConfirmCancelRunModal}
                trackProtocolRunEvent={trackProtocolRunEvent}
                robotAnalyticsData={robotAnalyticsData}
                protocolName={protocolName}
                runStatus={runStatus}
                currentRunCommandIndex={currentRunCommandIndex}
                robotSideAnalysis={robotSideAnalysis}
                runTimerInfo={{ runStatus, startedAt, stoppedAt, completedAt }}
                lastAnimatedCommand={lastAnimatedCommand.current}
                updateLastAnimatedCommand={(newCommandKey: string) =>
                  (lastAnimatedCommand.current = newCommandKey)
                }
              />
            ) : (
              <RunningProtocolCommandList
                protocolName={protocolName}
                runStatus={runStatus}
                playRun={playRun}
                pauseRun={pauseRun}
                setShowConfirmCancelRunModal={setShowConfirmCancelRunModal}
                trackProtocolRunEvent={trackProtocolRunEvent}
                robotAnalyticsData={robotAnalyticsData}
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
            gridGap={SPACING.spacing16}
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
        marginTop={SPACING.spacing24}
        width="fit-content"
        paddingRight={SPACING.spacing32}
      >
        <Link to="/dashboard">
          <TertiaryButton>back to RobotDashboard</TertiaryButton>
        </Link>
      </Flex>
    </>
  )
}
