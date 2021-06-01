import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useConditionalConfirm, SpinnerModalPage } from '@opentrons/components'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import * as RobotApi from '../../redux/robot-api'
import * as Sessions from '../../redux/sessions'
import * as Config from '../../redux/config'

import { getUncalibratedTipracksByMount } from '../../redux/pipettes'
import { getTipLengthCalibrationSession } from '../../redux/sessions/tip-length-calibration/selectors'
import { getPipetteOffsetCalibrationSession } from '../../redux/sessions/pipette-offset-calibration/selectors'

import {
  CalibrateTipLength,
  ConfirmRecalibrationModal,
} from '../../organisms/CalibrateTipLength'
import { AskForCalibrationBlockModal } from '../../organisms/CalibrateTipLength/AskForCalibrationBlockModal'

import { UncalibratedInfo } from './UncalibratedInfo'
import { TipLengthCalibrationInfoBox } from '../../organisms/CalibrateTipLength/TipLengthCalibrationInfoBox'
import { Portal } from '../../App/portal'
import { CalibratePipetteOffset } from '../../organisms/CalibratePipetteOffset'
import { INTENT_TIP_LENGTH_IN_PROTOCOL } from '../../organisms/CalibrationPanels'
import {
  tipLengthCalibrationStarted,
  pipetteOffsetCalibrationStarted,
} from '../../redux/analytics'

import type { State } from '../../redux/types'
import type {
  SessionCommandString,
  PipetteOffsetCalibrationSession,
  TipLengthCalibrationSession,
} from '../../redux/sessions/types'
import type { RequestState } from '../../redux/robot-api/types'
import type { TipracksByMountMap } from '../../redux/robot'
import type { Mount } from '@opentrons/components'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

const TIP_LENGTH_CALIBRATION = 'tip length calibration'
const EXIT = 'exit'

export interface CalibrateTipLengthControlProps {
  robotName: string
  hasCalibrated: boolean
  mount: Mount
  tipRackDefinition: LabwareDefinition2
  isExtendedPipOffset: boolean
}

// tip length calibration commands for which the full page spinner should not appear
const spinnerCommandBlockList: SessionCommandString[] = [
  Sessions.sharedCalCommands.JOG,
]

export function CalibrateTipLengthControl({
  robotName,
  hasCalibrated,
  mount,
  tipRackDefinition,
  isExtendedPipOffset,
}: CalibrateTipLengthControlProps): JSX.Element {
  const createRequestId = React.useRef<string | null>(null)
  const trackedRequestId = React.useRef<string | null>(null)
  const jogRequestId = React.useRef<string | null>(null)
  const dispatch = useDispatch()

  const sessionType = isExtendedPipOffset
    ? Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION
    : Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION

  const uriFromDef = (definition: LabwareDefinition2): string =>
    `${definition.namespace}/${definition.parameters.loadName}/${definition.version}`

  const dispatchAnalyticsEvent = isExtendedPipOffset
    ? (calBlock: boolean): void => {
        dispatch(
          pipetteOffsetCalibrationStarted(
            INTENT_TIP_LENGTH_IN_PROTOCOL,
            mount,
            calBlock,
            true,
            uriFromDef(tipRackDefinition)
          )
        )
      }
    : (calBlock: boolean): void => {
        dispatch(
          tipLengthCalibrationStarted(
            INTENT_TIP_LENGTH_IN_PROTOCOL,
            mount,
            calBlock,
            uriFromDef(tipRackDefinition)
          )
        )
      }

  const [dispatchRequests] = RobotApi.useDispatchApiRequests(
    dispatchedAction => {
      if (
        dispatchedAction.type === Sessions.ENSURE_SESSION &&
        dispatchedAction.payload.sessionType === sessionType
      ) {
        // @ts-expect-error TODO: account for possible absence of requestId on meta
        createRequestId.current = dispatchedAction.meta.requestId
      } else if (
        dispatchedAction.type === Sessions.CREATE_SESSION_COMMAND &&
        dispatchedAction.payload.command.command ===
          Sessions.sharedCalCommands.JOG
      ) {
        // @ts-expect-error TODO: account for possible absence of requestId on meta
        jogRequestId.current = dispatchedAction.meta.requestId
      } else if (
        dispatchedAction.type !== Sessions.CREATE_SESSION_COMMAND ||
        !spinnerCommandBlockList.includes(
          dispatchedAction.payload.command.command
        )
      ) {
        // @ts-expect-error TODO: account for possible absence of meta on action, requestId on meta
        trackedRequestId.current = dispatchedAction.meta.requestId
      }
    }
  )

  const tipLengthCalibrationSession: TipLengthCalibrationSession | null = useSelector(
    (state: State) => {
      return getTipLengthCalibrationSession(state, robotName)
    }
  )
  const extendedPipetteCalibrationSession: PipetteOffsetCalibrationSession | null = useSelector(
    (state: State) => {
      return getPipetteOffsetCalibrationSession(state, robotName)
    }
  )

  const configHasCalibrationBlock = useSelector(Config.getHasCalibrationBlock)
  const [showCalBlockModal, setShowCalBlockModal] = React.useState(false)

  const handleStart = (hasBlockModalResponse: boolean | null = null): void => {
    if (hasBlockModalResponse === null && configHasCalibrationBlock === null) {
      setShowCalBlockModal(true)
    } else {
      setShowCalBlockModal(false)
      const sharedOptions = {
        mount,
        hasCalibrationBlock: Boolean(
          configHasCalibrationBlock ?? hasBlockModalResponse
        ),
        tipRackDefinition,
      }
      const options = isExtendedPipOffset
        ? { ...sharedOptions, shouldRecalibrateTipLength: true }
        : sharedOptions
      dispatchRequests(Sessions.ensureSession(robotName, sessionType, options))
      dispatchAnalyticsEvent(sharedOptions.hasCalibrationBlock)
    }
  }

  const startingSession =
    useSelector<State, RequestState | null>(state =>
      createRequestId.current
        ? RobotApi.getRequestById(state, createRequestId.current)
        : null
    )?.status === RobotApi.PENDING

  const showSpinner =
    useSelector<State, RequestState | null>(state =>
      trackedRequestId.current
        ? RobotApi.getRequestById(state, trackedRequestId.current)
        : null
    )?.status === RobotApi.PENDING

  const isJogging =
    useSelector((state: State) =>
      jogRequestId.current
        ? RobotApi.getRequestById(state, jogRequestId.current)
        : null
    )?.status === RobotApi.PENDING

  const uncalibratedTipracksByMount: TipracksByMountMap = useSelector(
    (state: State) => {
      return getUncalibratedTipracksByMount(state, robotName)
    }
  )

  const { confirm, showConfirmation, cancel } = useConditionalConfirm(
    handleStart,
    hasCalibrated
  )

  return (
    <>
      <TipLengthCalibrationInfoBox
        title={getLabwareDisplayName(tipRackDefinition)}
      >
        <UncalibratedInfo
          uncalibratedTipracksByMount={uncalibratedTipracksByMount}
          mount={mount}
          showSpinner={showSpinner}
          hasCalibrated={hasCalibrated}
          handleStart={() => confirm(null)} // hasBlockModalResponse === null when TLC started from this button
        />
        {showConfirmation && (
          <Portal>
            <ConfirmRecalibrationModal
              confirm={confirm}
              cancel={cancel}
              tiprackDisplayName={tipRackDefinition.metadata.displayName}
            />
          </Portal>
        )}
      </TipLengthCalibrationInfoBox>
      <Portal level="top">
        {showCalBlockModal ? (
          <AskForCalibrationBlockModal
            onResponse={handleStart}
            titleBarTitle={TIP_LENGTH_CALIBRATION}
            closePrompt={() => setShowCalBlockModal(false)}
          />
        ) : null}
        {startingSession ? (
          <SpinnerModalPage
            titleBar={{
              title: TIP_LENGTH_CALIBRATION,
              back: {
                disabled: true,
                title: EXIT,
                children: EXIT,
              },
            }}
          />
        ) : null}
        {isExtendedPipOffset ? (
          <CalibratePipetteOffset
            session={extendedPipetteCalibrationSession}
            robotName={robotName}
            showSpinner={showSpinner}
            dispatchRequests={dispatchRequests}
            isJogging={isJogging}
            intent={INTENT_TIP_LENGTH_IN_PROTOCOL}
          />
        ) : (
          <CalibrateTipLength
            session={tipLengthCalibrationSession}
            robotName={robotName}
            showSpinner={showSpinner}
            dispatchRequests={dispatchRequests}
            isJogging={isJogging}
          />
        )}
      </Portal>
    </>
  )
}
