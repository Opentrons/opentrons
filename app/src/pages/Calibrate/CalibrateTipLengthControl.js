// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { type Mount, useConditionalConfirm } from '@opentrons/components'
import * as RobotApi from '../../robot-api'
import * as Sessions from '../../sessions'

import { getUseTrashSurfaceForTipCal } from '../../config'
import { setUseTrashSurfaceForTipCal } from '../../calibration'
import { getUncalibratedTipracksByMount } from '../../pipettes'
import { getTipLengthCalibrationSession } from '../../sessions/tip-length-calibration/selectors'
import { getPipetteOffsetCalibrationSession } from '../../sessions/pipette-offset-calibration/selectors'

import {
  CalibrateTipLength,
  AskForCalibrationBlockModal,
  ConfirmRecalibrationModal,
} from '../../components/CalibrateTipLength'

import { UncalibratedInfo } from './UncalibratedInfo'
import { TipLengthCalibrationInfoBox } from '../../components/CalibrateTipLength/TipLengthCalibrationInfoBox'
import { Portal } from '../../components/portal'
import { CalibratePipetteOffset } from '../../components/CalibratePipetteOffset'
import {
  getLabwareDisplayName,
  type LabwareDefinition2,
} from '@opentrons/shared-data'

import type { State, Dispatch } from '../../types'
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
  const [showCalBlockPrompt, setShowCalBlockPrompt] = React.useState(false)
  const dispatch = useDispatch<Dispatch>()

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

  const useTrashSurfaceForTipCalSetting = useSelector(
    getUseTrashSurfaceForTipCal
  )
  const useTrashSurface = React.useRef<boolean | null>(
    useTrashSurfaceForTipCalSetting
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
  const handleStart = () => {
    if (isExtendedPipOffset && useTrashSurface.current !== null) {
      dispatchRequests(
        Sessions.ensureSession(
          robotName,
          Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
          {
            mount,
            hasCalibrationBlock: !useTrashSurface.current,
            shouldRecalibrateTipLength: true,
            tipRackDefinition,
          }
        )
      )
    } else if (useTrashSurface.current !== null) {
      dispatchRequests(
        Sessions.ensureSession(
          robotName,
          Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION,
          {
            mount,
            hasCalibrationBlock: !useTrashSurface.current,
            tipRackDefinition,
          }
        )
      )
    } else {
      setShowCalBlockPrompt(true)
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

  const setHasBlock = (hasBlock: boolean, rememberPreference: boolean) => {
    useTrashSurface.current = !hasBlock
    if (rememberPreference) {
      dispatch(setUseTrashSurfaceForTipCal(!hasBlock))
    }
    handleStart()
    setShowCalBlockPrompt(false)
  }

  const handleCloseWizard = () => {
    setShowWizard(false)
    useTrashSurface.current = useTrashSurfaceForTipCalSetting
  }

  const { confirm, showConfirmation, cancel } = useConditionalConfirm(
    handleStart,
    hasCalibrated
  )

  const uncalibratedTipracksByMount: TipracksByMountMap = useSelector(state => {
    return getUncalibratedTipracksByMount(state, robotName)
  })

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
      {showCalBlockPrompt && (
        <Portal>
          <AskForCalibrationBlockModal setHasBlock={setHasBlock} />
        </Portal>
      )}
      {showWizard && useTrashSurface.current !== null && (
        <Portal>
          {isExtendedPipOffset ? (
            <CalibratePipetteOffset
              session={extendedPipetteCalibrationSession}
              robotName={robotName}
              hasBlock={!useTrashSurface.current}
              closeWizard={handleCloseWizard}
              showSpinner={showSpinner}
              dispatchRequests={dispatchRequests}
            />
          ) : (
            <CalibrateTipLength
              robotName={robotName}
              session={tipLengthCalibrationSession}
              closeWizard={handleCloseWizard}
              hasBlock={!useTrashSurface.current}
              showSpinner={showSpinner}
              dispatchRequests={dispatchRequests}
            />
          )}
        </Portal>
      )}
    </>
  )
}
