import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  SPACING,
  SpinnerModalPage,
  AlertModal,
  useInterval,
} from '@opentrons/components'

import { Portal } from '../../App/portal'
import { Line } from '../../atoms/structure'
import { StyledText } from '../../atoms/text'
import { CalibrateDeck } from '../../organisms/CalibrateDeck'
import { DeprecatedCalibrateDeck } from '../../organisms/DeprecatedCalibrateDeck'
import { CalibrationStatusCard } from '../../organisms/CalibrationStatusCard'
import { CheckCalibration } from '../../organisms/CheckCalibration'
import { DeprecatedCheckCalibration } from '../../organisms/DeprecatedCheckCalibration'
import {
  usePipetteOffsetCalibrations,
  useRobot,
  useAttachedPipettes,
  useRunStatuses,
  useIsOT3,
} from '../../organisms/Devices/hooks'
import { HowCalibrationWorksModal } from '../../organisms/HowCalibrationWorksModal'
import * as Calibration from '../../redux/calibration'
import * as Config from '../../redux/config'
import { CONNECTABLE } from '../../redux/discovery'
import * as RobotApi from '../../redux/robot-api'
import { getDeckCalibrationSession } from '../../redux/sessions/deck-calibration/selectors'
import * as Sessions from '../../redux/sessions'
import { CalibrationDataDownload } from './CalibrationDataDownload'
import { CalibrationHealthCheck } from './CalibrationHealthCheck'
import { RobotSettingsDeckCalibration } from './RobotSettingsDeckCalibration'
import { RobotSettingsPipetteOffsetCalibration } from './RobotSettingsPipetteOffsetCalibration'
import { RobotSettingsTipLengthCalibration } from './RobotSettingsTipLengthCalibration'

import type { Mount } from '@opentrons/components'
import type { RequestState } from '../../redux/robot-api/types'
import type {
  SessionCommandString,
  DeckCalibrationSession,
} from '../../redux/sessions/types'
import type { State, Dispatch } from '../../redux/types'

const CALS_FETCH_MS = 5000

interface CalibrationProps {
  robotName: string
  updateRobotStatus: (isRobotBusy: boolean) => void
}

export interface FormattedPipetteOffsetCalibration {
  modelName?: string
  serialNumber?: string
  mount: Mount
  tiprack?: string
  lastCalibrated?: string
  markedBad?: boolean
}

const spinnerCommandBlockList: SessionCommandString[] = [
  Sessions.sharedCalCommands.JOG,
]

export function RobotSettingsCalibration({
  robotName,
  updateRobotStatus,
}: CalibrationProps): JSX.Element {
  const { t } = useTranslation([
    'device_settings',
    'robot_calibration',
    'shared',
  ])
  const trackedRequestId = React.useRef<string | null>(null)
  const createRequestId = React.useRef<string | null>(null)
  const jogRequestId = React.useRef<string | null>(null)

  const [
    showHowCalibrationWorksModal,
    setShowHowCalibrationWorksModal,
  ] = React.useState(false)
  const [
    showPipetteOffsetCalibrationBanner,
    setShowPipetteOffsetCalibrationBanner,
  ] = React.useState<boolean>(false)
  const [
    pipetteOffsetCalBannerType,
    setPipetteOffsetCalBannerType,
  ] = React.useState<string>('')

  const robot = useRobot(robotName)
  const notConnectable = robot?.status !== CONNECTABLE
  const isOT3 = useIsOT3(robotName)
  const dispatch = useDispatch<Dispatch>()
  const enableCalibrationWizards = Config.useFeatureFlag(
    'enableCalibrationWizards'
  )

  React.useEffect(() => {
    dispatch(Sessions.fetchAllSessions(robotName))
  }, [])

  const [dispatchRequests] = RobotApi.useDispatchApiRequests(
    dispatchedAction => {
      if (dispatchedAction.type === Sessions.ENSURE_SESSION) {
        createRequestId.current =
          'requestId' in dispatchedAction.meta
            ? dispatchedAction.meta.requestId ?? null
            : null
      } else if (
        dispatchedAction.type === Sessions.CREATE_SESSION_COMMAND &&
        dispatchedAction.payload.command.command ===
          Sessions.sharedCalCommands.JOG
      ) {
        jogRequestId.current =
          'requestId' in dispatchedAction.meta
            ? dispatchedAction.meta.requestId ?? null
            : null
      } else if (
        dispatchedAction.type !== Sessions.CREATE_SESSION_COMMAND ||
        !spinnerCommandBlockList.includes(
          dispatchedAction.payload.command.command
        )
      ) {
        trackedRequestId.current =
          'meta' in dispatchedAction && 'requestId' in dispatchedAction.meta
            ? dispatchedAction.meta.requestId ?? null
            : null
      }
    }
  )

  // wait for robot request to resolve instead of using name directly from params
  const pipetteOffsetCalibrations = usePipetteOffsetCalibrations(robot?.name)
  const attachedPipettes = useAttachedPipettes()
  const { isRunRunning: isRunning } = useRunStatuses()

  const pipettePresent =
    !(attachedPipettes.left == null) || !(attachedPipettes.right == null)

  const isPending =
    useSelector<State, RequestState | null>(state =>
      trackedRequestId.current != null
        ? RobotApi.getRequestById(state, trackedRequestId.current)
        : null
    )?.status === RobotApi.PENDING

  const createRequest = useSelector((state: State) =>
    createRequestId.current != null
      ? RobotApi.getRequestById(state, createRequestId.current)
      : null
  )

  const createStatus = createRequest?.status

  const isJogging =
    useSelector((state: State) =>
      jogRequestId.current != null
        ? RobotApi.getRequestById(state, jogRequestId.current)
        : null
    )?.status === RobotApi.PENDING

  const deckCalibrationSession: DeckCalibrationSession | null = useSelector(
    (state: State) => {
      return getDeckCalibrationSession(state, robotName)
    }
  )

  let buttonDisabledReason: string | null = null
  if (notConnectable) {
    buttonDisabledReason = t('shared:disabled_cannot_connect')
  } else if (isRunning) {
    buttonDisabledReason = t('shared:disabled_protocol_is_running')
  } else if (!pipettePresent) {
    buttonDisabledReason = t('shared:disabled_no_pipette_attached')
  }
  const checkHealthSession = useSelector((state: State) => {
    const session: Sessions.Session | null = Sessions.getRobotSessionOfType(
      state,
      robotName,
      Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK
    )
    if (
      session &&
      session.sessionType === Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK
    ) {
      // TODO: add this analytics event when we deprecate this event firing in redux/analytics makeEvent
      return session
    }
    return null
  })

  const formatPipetteOffsetCalibrations = (): FormattedPipetteOffsetCalibration[] => {
    const pippets = []
    if (attachedPipettes != null) {
      pippets.push({
        modelName: attachedPipettes.left?.modelSpecs?.displayName,
        serialNumber: attachedPipettes.left?.id,
        mount: 'left' as Mount,
        tiprack: pipetteOffsetCalibrations?.find(
          p => p.pipette === attachedPipettes.left?.id
        )?.tiprackUri,
        lastCalibrated: pipetteOffsetCalibrations?.find(
          p => p.pipette === attachedPipettes.left?.id
        )?.lastModified,
        markedBad: pipetteOffsetCalibrations?.find(
          p => p.pipette === attachedPipettes.left?.id
        )?.status.markedBad,
      })
      pippets.push({
        modelName: attachedPipettes.right?.modelSpecs?.displayName,
        serialNumber: attachedPipettes.right?.id,
        mount: 'right' as Mount,
        tiprack: pipetteOffsetCalibrations?.find(
          p => p.pipette === attachedPipettes.right?.id
        )?.tiprackUri,
        lastCalibrated: pipetteOffsetCalibrations?.find(
          p => p.pipette === attachedPipettes.right?.id
        )?.lastModified,
        markedBad: pipetteOffsetCalibrations?.find(
          p => p.pipette === attachedPipettes.right?.id
        )?.status.markedBad,
      })
    }
    return pippets
  }

  const checkPipetteCalibrationMissing = (): void => {
    // checked the number of attached pipettes
    const numberOfAttached =
      attachedPipettes != null &&
      Object.keys(attachedPipettes)
        .map(mount => attachedPipettes[mount as Mount] != null)
        .filter(x => x).length
    const isPipettesNumberMatched =
      numberOfAttached === formatPipetteOffsetCalibrations().length
    if (
      pipetteOffsetCalibrations === null ||
      (Object.values(pipetteOffsetCalibrations).length <= 1 &&
        isPipettesNumberMatched)
    ) {
      setShowPipetteOffsetCalibrationBanner(true)
      setPipetteOffsetCalBannerType('error')
    } else {
      const left = attachedPipettes?.left?.id
      const right = attachedPipettes?.right?.id
      const markedBads =
        pipetteOffsetCalibrations?.filter(
          p =>
            (p.pipette === left && p.status.markedBad) ||
            (p.pipette === right && p.status.markedBad)
        ) ?? null
      if (markedBads.length !== 0 && isPipettesNumberMatched) {
        setShowPipetteOffsetCalibrationBanner(true)
        setPipetteOffsetCalBannerType('warning')
      } else {
        setShowPipetteOffsetCalibrationBanner(false)
      }
    }
  }

  React.useEffect(() => {
    if (createStatus === RobotApi.SUCCESS) {
      createRequestId.current = null
    }
  }, [createStatus])

  // Note: following fetch need to reflect the latest state of calibrations
  // when a user does calibration or rename a robot.
  useInterval(
    () => {
      dispatch(Calibration.fetchCalibrationStatus(robotName))
      dispatch(Calibration.fetchPipetteOffsetCalibrations(robotName))
      dispatch(Calibration.fetchTipLengthCalibrations(robotName))
      checkPipetteCalibrationMissing()
    },
    CALS_FETCH_MS,
    true
  )

  return (
    <>
      <Portal level="top">
        {enableCalibrationWizards ? (
          <CalibrateDeck
            session={deckCalibrationSession}
            robotName={robotName}
            dispatchRequests={dispatchRequests}
            showSpinner={isPending}
            isJogging={isJogging}
          />
        ) : (
          <DeprecatedCalibrateDeck
            session={deckCalibrationSession}
            robotName={robotName}
            dispatchRequests={dispatchRequests}
            showSpinner={isPending}
            isJogging={isJogging}
          />
        )}

        {createStatus === RobotApi.PENDING ? (
          <SpinnerModalPage
            titleBar={{
              title: t('robot_calibration:health_check_title'),
              back: {
                disabled: true,
                title: t('shared:exit'),
                children: t('shared:exit'),
              },
            }}
          />
        ) : null}
        {enableCalibrationWizards ? (
          <CheckCalibration
            session={checkHealthSession}
            robotName={robotName}
            dispatchRequests={dispatchRequests}
            showSpinner={isPending}
            isJogging={isJogging}
          />
        ) : (
          <DeprecatedCheckCalibration
            session={checkHealthSession}
            robotName={robotName}
            dispatchRequests={dispatchRequests}
            showSpinner={isPending}
            isJogging={isJogging}
          />
        )}
        {createStatus === RobotApi.FAILURE && (
          <AlertModal
            alertOverlay
            heading={t('robot_calibration:deck_calibration_failure')}
            buttons={[
              {
                children: t('shared:ok'),
                onClick: () => {
                  createRequestId.current &&
                    dispatch(RobotApi.dismissRequest(createRequestId.current))
                  createRequestId.current = null
                },
              },
            ]}
          >
            <StyledText>{t('deck_calibration_error_occurred')}</StyledText>
            <StyledText>
              {createRequest != null &&
                'error' in createRequest &&
                createRequest.error != null &&
                RobotApi.getErrorResponseMessage(createRequest.error)}
            </StyledText>
          </AlertModal>
        )}
      </Portal>
      {showHowCalibrationWorksModal ? (
        <HowCalibrationWorksModal
          onCloseClick={() => setShowHowCalibrationWorksModal(false)}
        />
      ) : null}
      {enableCalibrationWizards ? (
        <CalibrationStatusCard
          robotName={robotName}
          setShowHowCalibrationWorksModal={setShowHowCalibrationWorksModal}
        />
      ) : (
        <>
          <CalibrationDataDownload
            robotName={robotName}
            setShowHowCalibrationWorksModal={setShowHowCalibrationWorksModal}
          />
          {!isOT3 ? <Line /> : null}
        </>
      )}

      {!isOT3 ? (
        <RobotSettingsDeckCalibration
          buttonDisabledReason={buttonDisabledReason}
          robotName={robotName}
          updateRobotStatus={updateRobotStatus}
        />
      ) : null}
      {!isOT3 || !enableCalibrationWizards ? (
        <Line
          marginBottom={
            showPipetteOffsetCalibrationBanner ? SPACING.spacing4 : null
          }
        />
      ) : null}
      <RobotSettingsPipetteOffsetCalibration
        pipetteOffsetCalBannerType={pipetteOffsetCalBannerType}
        robotName={robotName}
        showPipetteOffsetCalibrationBanner={showPipetteOffsetCalibrationBanner}
        updateRobotStatus={updateRobotStatus}
      />
      {!isOT3 ? (
        <>
          <Line />
          <RobotSettingsTipLengthCalibration
            robotName={robotName}
            updateRobotStatus={updateRobotStatus}
          />
        </>
      ) : null}
      <Line />
      {/* TODO(bh, 2022-09-07): possibly remove when calibration wizard feature flag removed */}
      <CalibrationHealthCheck
        buttonDisabledReason={buttonDisabledReason}
        dispatchRequests={dispatchRequests}
        isPending={isPending}
        robotName={robotName}
        updateRobotStatus={updateRobotStatus}
      />
    </>
  )
}
