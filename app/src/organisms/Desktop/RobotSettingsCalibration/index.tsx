import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  AlertModal,
  SPACING,
  SpinnerModalPage,
  LegacyStyledText,
} from '@opentrons/components'
import {
  useAllPipetteOffsetCalibrationsQuery,
  useAllTipLengthCalibrationsQuery,
  useCalibrationStatusQuery,
  useInstrumentsQuery,
  useModulesQuery,
} from '@opentrons/react-api-client'

import { getTopPortalEl } from '/app/App/portal'
import { Line } from '/app/atoms/structure'
import { CalibrateDeck } from '../CalibrateDeck'
import { CalibrationStatusCard } from '../CalibrationStatusCard'
import { CheckCalibration } from '../CheckCalibration'
import { useRunStatuses } from '/app/resources/runs'
import { useAttachedPipettesFromInstrumentsQuery } from '/app/resources/instruments'
import { useRobot, useIsFlex } from '/app/redux-resources/robots'
import { HowCalibrationWorksModal } from '../HowCalibrationWorksModal'
import { CONNECTABLE } from '/app/redux/discovery'
import * as RobotApi from '/app/redux/robot-api'
import { getDeckCalibrationSession } from '/app/redux/sessions/deck-calibration/selectors'
import * as Sessions from '/app/redux/sessions'
import { CalibrationDataDownload } from './CalibrationDataDownload'
import { CalibrationHealthCheck } from './CalibrationHealthCheck'
import { RobotSettingsDeckCalibration } from './RobotSettingsDeckCalibration'
import { RobotSettingsGripperCalibration } from './RobotSettingsGripperCalibration'
import { RobotSettingsPipetteOffsetCalibration } from './RobotSettingsPipetteOffsetCalibration'
import { RobotSettingsTipLengthCalibration } from './RobotSettingsTipLengthCalibration'
import { RobotSettingsModuleCalibration } from './RobotSettingsModuleCalibration'

import type { GripperData } from '@opentrons/api-client'
import type { Mount } from '@opentrons/components'
import type { RequestState } from '/app/redux/robot-api/types'
import type {
  SessionCommandString,
  DeckCalibrationSession,
} from '/app/redux/sessions/types'
import type { State, Dispatch } from '/app/redux/types'

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
  const trackedRequestId = useRef<string | null>(null)
  const createRequestId = useRef<string | null>(null)
  const jogRequestId = useRef<string | null>(null)

  const [
    showHowCalibrationWorksModal,
    setShowHowCalibrationWorksModal,
  ] = useState(false)

  const robot = useRobot(robotName)
  const notConnectable = robot?.status !== CONNECTABLE
  const isFlex = useIsFlex(robotName)
  const dispatch = useDispatch<Dispatch>()

  useEffect(() => {
    dispatch(Sessions.fetchAllSessions(robotName))
  }, [dispatch, robotName])

  const [dispatchRequests, requestIds] = RobotApi.useDispatchApiRequests(
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

  // Modules Calibration
  const attachedModules =
    useModulesQuery({
      refetchInterval: CALS_FETCH_MS,
    })?.data?.data ?? []

  // Note: following fetch need to reflect the latest state of calibrations
  // when a user does calibration or rename a robot.
  useCalibrationStatusQuery({ refetchInterval: CALS_FETCH_MS })
  useAllTipLengthCalibrationsQuery({ refetchInterval: CALS_FETCH_MS })
  const pipetteOffsetCalibrations =
    useAllPipetteOffsetCalibrationsQuery({ refetchInterval: CALS_FETCH_MS })
      .data?.data ?? []
  const attachedInstruments =
    useInstrumentsQuery({ refetchInterval: CALS_FETCH_MS }).data?.data ?? []
  const attachedGripper =
    (attachedInstruments ?? []).find(
      (i): i is GripperData => i.instrumentType === 'gripper' && i.ok
    ) ?? null
  const attachedPipettes = useAttachedPipettesFromInstrumentsQuery()
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
      session != null &&
      session.sessionType === Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK
    ) {
      // TODO: add this analytics event when we deprecate this event firing in redux/analytics makeEvent
      return session
    }
    return null
  })

  const formattedPipetteOffsetCalibrations: FormattedPipetteOffsetCalibration[] = []

  if (!isFlex && attachedPipettes != null) {
    formattedPipetteOffsetCalibrations.push({
      modelName: attachedPipettes.left?.displayName,
      serialNumber: attachedPipettes.left?.serialNumber,
      mount: 'left' as Mount,
      tiprack: pipetteOffsetCalibrations?.find(
        p => p.pipette === attachedPipettes.left?.serialNumber
      )?.tiprackUri,
      lastCalibrated: pipetteOffsetCalibrations?.find(
        p => p.pipette === attachedPipettes.left?.serialNumber
      )?.lastModified,
      markedBad: pipetteOffsetCalibrations?.find(
        p => p.pipette === attachedPipettes.left?.serialNumber
      )?.status.markedBad,
    })
    formattedPipetteOffsetCalibrations.push({
      modelName: attachedPipettes.right?.displayName,
      serialNumber: attachedPipettes.right?.serialNumber,
      mount: 'right' as Mount,
      tiprack: pipetteOffsetCalibrations?.find(
        p => p.pipette === attachedPipettes.right?.serialNumber
      )?.tiprackUri,
      lastCalibrated: pipetteOffsetCalibrations?.find(
        p => p.pipette === attachedPipettes.right?.serialNumber
      )?.lastModified,
      markedBad: pipetteOffsetCalibrations?.find(
        p => p.pipette === attachedPipettes.right?.serialNumber
      )?.status.markedBad,
    })
  } else {
    formattedPipetteOffsetCalibrations.push({
      modelName: attachedPipettes.left?.displayName,
      serialNumber: attachedPipettes.left?.serialNumber,
      mount: 'left' as Mount,
      lastCalibrated:
        attachedPipettes.left?.data.calibratedOffset?.last_modified,
    })
    formattedPipetteOffsetCalibrations.push({
      modelName: attachedPipettes.right?.displayName,
      serialNumber: attachedPipettes.right?.serialNumber,
      mount: 'right' as Mount,
      lastCalibrated:
        attachedPipettes.right?.data.calibratedOffset?.last_modified,
    })
  }

  useEffect(() => {
    if (createStatus === RobotApi.SUCCESS) {
      createRequestId.current = null
    }
  }, [createStatus])

  return (
    <>
      {createPortal(
        <>
          <CalibrateDeck
            session={deckCalibrationSession}
            robotName={robotName}
            dispatchRequests={dispatchRequests}
            showSpinner={isPending}
            isJogging={isJogging}
            requestIds={requestIds}
          />
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
          <CheckCalibration
            session={checkHealthSession}
            robotName={robotName}
            dispatchRequests={dispatchRequests}
            showSpinner={isPending}
            isJogging={isJogging}
          />
          {createStatus === RobotApi.FAILURE && (
            <AlertModal
              alertOverlay
              heading={t('robot_calibration:deck_calibration_failure')}
              buttons={[
                {
                  children: t('shared:ok'),
                  onClick: () => {
                    createRequestId.current != null &&
                      dispatch(RobotApi.dismissRequest(createRequestId.current))
                    createRequestId.current = null
                  },
                },
              ]}
            >
              <LegacyStyledText>
                {t('deck_calibration_error_occurred')}
              </LegacyStyledText>
              <LegacyStyledText>
                {createRequest != null &&
                  'error' in createRequest &&
                  createRequest.error != null &&
                  RobotApi.getErrorResponseMessage(createRequest.error)}
              </LegacyStyledText>
            </AlertModal>
          )}
        </>,
        getTopPortalEl()
      )}
      {showHowCalibrationWorksModal ? (
        <HowCalibrationWorksModal
          onCloseClick={() => {
            setShowHowCalibrationWorksModal(false)
          }}
        />
      ) : null}
      {isFlex ? (
        <>
          <CalibrationDataDownload
            {...{ robotName, setShowHowCalibrationWorksModal }}
          />
          <Line marginTop={SPACING.spacing24} />
          <RobotSettingsPipetteOffsetCalibration
            formattedPipetteOffsetCalibrations={
              formattedPipetteOffsetCalibrations
            }
            robotName={robotName}
            updateRobotStatus={updateRobotStatus}
          />
          <Line />
          <RobotSettingsGripperCalibration
            gripper={attachedGripper}
            robotName={robotName}
          />
          <Line />
          <RobotSettingsModuleCalibration
            attachedModules={attachedModules}
            updateRobotStatus={updateRobotStatus}
            formattedPipetteOffsetCalibrations={
              formattedPipetteOffsetCalibrations
            }
            robotName={robotName}
          />
        </>
      ) : (
        <>
          <CalibrationStatusCard
            {...{ robotName, setShowHowCalibrationWorksModal }}
          />
          <RobotSettingsDeckCalibration robotName={robotName} />
          <Line />
          <RobotSettingsPipetteOffsetCalibration
            formattedPipetteOffsetCalibrations={
              formattedPipetteOffsetCalibrations
            }
            robotName={robotName}
            updateRobotStatus={updateRobotStatus}
          />
          <Line />
          <RobotSettingsTipLengthCalibration
            formattedPipetteOffsetCalibrations={
              formattedPipetteOffsetCalibrations
            }
            robotName={robotName}
            updateRobotStatus={updateRobotStatus}
          />
          <Line />
          <CalibrationHealthCheck
            buttonDisabledReason={buttonDisabledReason}
            dispatchRequests={dispatchRequests}
            isPending={isPending}
            robotName={robotName}
          />
          <Line marginBottom={SPACING.spacing24} />
          <CalibrationDataDownload
            robotName={robotName}
            setShowHowCalibrationWorksModal={setShowHowCalibrationWorksModal}
          />
        </>
      )}
    </>
  )
}
