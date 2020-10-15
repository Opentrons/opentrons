// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import { type Mount, useConditionalConfirm } from '@opentrons/components'
import * as RobotApi from '../../robot-api'
import * as Sessions from '../../sessions'

import { getUncalibratedTipracksByMount } from '../../pipettes'
import { getTipLengthCalibrationSession } from '../../sessions/tip-length-calibration/selectors'
import { getPipetteOffsetCalibrationSession } from '../../sessions/pipette-offset-calibration/selectors'

import {
  CalibrateTipLength,
  ConfirmRecalibrationModal,
} from '../../components/CalibrateTipLength'
import { useAskForCalibrationBlock } from '../../components/CalibrateTipLength/useAskForCalibrationBlock'

import { UncalibratedInfo } from './UncalibratedInfo'
import { TipLengthCalibrationInfoBox } from '../../components/CalibrateTipLength/TipLengthCalibrationInfoBox'
import { Portal } from '../../components/portal'
import { CalibratePipetteOffset } from '../../components/CalibratePipetteOffset'
import {
  getLabwareDisplayName,
  type LabwareDefinition2,
} from '@opentrons/shared-data'

import type { State } from '../../types'
import type {
  SessionCommandString,
  PipetteOffsetCalibrationSession,
  TipLengthCalibrationSession,
} from '../../sessions/types'
import type { RequestState } from '../../robot-api/types'
import type { TipracksByMountMap } from '../../robot'

export type CalibrateTipLengthControlProps = {|
  robotName: string,
  hasCalibrated: boolean,
  mount: Mount,
  tipRackDefinition: LabwareDefinition2,
  isExtendedPipOffset: boolean,
|}

// tip length calibration commands for which the full page spinner should not appear
const spinnerCommandBlockList: Array<SessionCommandString> = [
  Sessions.sharedCalCommands.JOG,
]

export function CalibrateTipLengthControl({
  robotName,
  hasCalibrated,
  mount,
  tipRackDefinition,
  isExtendedPipOffset,
}: CalibrateTipLengthControlProps): React.Node {
  const [showWizard, setShowWizard] = React.useState(false)

  const trackedRequestId = React.useRef<string | null>(null)
  const deleteRequestId = React.useRef<string | null>(null)
  const createRequestId = React.useRef<string | null>(null)

  const [dispatchRequests] = RobotApi.useDispatchApiRequests(
    dispatchedAction => {
      if (dispatchedAction.type === Sessions.ENSURE_SESSION) {
        createRequestId.current = dispatchedAction.meta.requestId
      } else if (
        dispatchedAction.type === Sessions.DELETE_SESSION &&
        calibrationSession?.id === dispatchedAction.payload.sessionId
      ) {
        deleteRequestId.current = dispatchedAction.meta.requestId
      } else if (
        dispatchedAction.type !== Sessions.CREATE_SESSION_COMMAND ||
        !spinnerCommandBlockList.includes(
          dispatchedAction.payload.command.command
        )
      ) {
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

  const calibrationSession = isExtendedPipOffset
    ? extendedPipetteCalibrationSession
    : tipLengthCalibrationSession
  const handleStart = (useCalBlock: boolean) => {
    if (isExtendedPipOffset) {
      dispatchRequests(
        Sessions.ensureSession(
          robotName,
          Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
          {
            mount,
            hasCalibrationBlock: useCalBlock,
            shouldRecalibrateTipLength: true,
            tipRackDefinition,
          }
        )
      )
    } else {
      dispatchRequests(
        Sessions.ensureSession(
          robotName,
          Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION,
          {
            mount,
            hasCalibrationBlock: useCalBlock,
            tipRackDefinition,
          }
        )
      )
    }
  }
  const showSpinner =
    useSelector<State, RequestState | null>(state =>
      trackedRequestId.current
        ? RobotApi.getRequestById(state, trackedRequestId.current)
        : null
    )?.status === RobotApi.PENDING

  const shouldClose =
    useSelector<State, RequestState | null>(state =>
      deleteRequestId.current
        ? RobotApi.getRequestById(state, deleteRequestId.current)
        : null
    )?.status === RobotApi.SUCCESS

  const shouldOpen =
    useSelector((state: State) =>
      createRequestId.current
        ? RobotApi.getRequestById(state, createRequestId.current)
        : null
    )?.status === RobotApi.SUCCESS

  React.useEffect(() => {
    if (shouldOpen) {
      setShowWizard(true)
      createRequestId.current = null
    }
    if (shouldClose) {
      setShowWizard(false)
      deleteRequestId.current = null
    }
  }, [shouldOpen, shouldClose])

  const handleCloseWizard = () => {
    setShowWizard(false)
  }

  const uncalibratedTipracksByMount: TipracksByMountMap = useSelector(state => {
    return getUncalibratedTipracksByMount(state, robotName)
  })

  const [showCalBlockRequest, calBlockRequestModal] = useAskForCalibrationBlock(
    handleStart
  )

  const { confirm, showConfirmation, cancel } = useConditionalConfirm(() => {
    showCalBlockRequest(null)
  }, hasCalibrated)

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
          handleStart={confirm}
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
      {calBlockRequestModal}
      {showWizard && (
        <Portal>
          {isExtendedPipOffset ? (
            <CalibratePipetteOffset
              session={extendedPipetteCalibrationSession}
              robotName={robotName}
              closeWizard={handleCloseWizard}
              showSpinner={showSpinner}
              dispatchRequests={dispatchRequests}
            />
          ) : (
            <CalibrateTipLength
              robotName={robotName}
              session={tipLengthCalibrationSession}
              closeWizard={handleCloseWizard}
              showSpinner={showSpinner}
              dispatchRequests={dispatchRequests}
            />
          )}
        </Portal>
      )}
    </>
  )
}
