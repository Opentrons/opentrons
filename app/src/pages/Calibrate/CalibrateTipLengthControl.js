// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import last from 'lodash/last'
import { Icon, PrimaryButton, type Mount } from '@opentrons/components'
import * as RobotApi from '../../robot-api'
import * as Sessions from '../../sessions'
import { getUseTrashSurfaceForTipCal } from '../../config'
import { setUseTrashSurfaceForTipCal } from '../../calibration'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import {
  CalibrateTipLength,
  AskForCalibrationBlockModal,
} from '../../components/CalibrateTipLength'

import { CalibrationInfoBox } from '../../components/CalibrationInfoBox'
import { CalibrationInfoContent } from '../../components/CalibrationInfoContent'
import { Portal } from '../../components/portal'

import type { State, Dispatch } from '../../types'

export type CalibrateTipLengthControlProps = {|
  robotName: string,
  hasCalibrated: boolean,
  mount: Mount,
  tipRackDefinition: LabwareDefinition2,
|}

const IS_CALIBRATED = 'Pipette tip height is calibrated'
const IS_NOT_CALIBRATED = 'Pipette tip height is not calibrated'
const CALIBRATE_TIP_LENGTH = 'Calibrate tip length'
const RECALIBRATE_TIP_LENGTH = 'Re-Calibrate tip length'

export function CalibrateTipLengthControl({
  robotName,
  hasCalibrated,
  mount,
  tipRackDefinition,
}: CalibrateTipLengthControlProps): React.Node {
  const [showWizard, setShowWizard] = React.useState(false)
  const [showCalBlockPrompt, setShowCalBlockPrompt] = React.useState(false)
  const dispatch = useDispatch<Dispatch>()
  const [dispatchRequest, requestIds] = RobotApi.useDispatchApiRequest()

  const useTrashSurfaceForTipCalSetting = useSelector(
    getUseTrashSurfaceForTipCal
  )
  const useTrashSurface = React.useRef<boolean | null>(
    useTrashSurfaceForTipCalSetting
  )

  const requestState = useSelector((state: State) => {
    const reqId = last(requestIds) ?? null
    return RobotApi.getRequestById(state, reqId)
  })
  const requestStatus = requestState?.status ?? null

  React.useEffect(() => {
    if (requestStatus === RobotApi.SUCCESS) setShowWizard(true)
  }, [requestStatus])

  const tipLengthCalibrationSession = useSelector((state: State) => {
    const session: Sessions.Session | null = Sessions.getRobotSessionOfType(
      state,
      robotName,
      Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION
    )
    if (
      session &&
      session.sessionType === Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION
    ) {
      return session
    }
    return null
  })

  const handleStart = () => {
    if (useTrashSurface.current !== null) {
      dispatchRequest(
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

  return (
    <>
      <CalibrationInfoBox
        confirmed={hasCalibrated}
        title={`${mount} pipette tip length calibration`}
      >
        <UncalibratedInfo
          requestStatus={requestStatus}
          hasCalibrated={hasCalibrated}
          handleStart={handleStart}
        />
      </CalibrationInfoBox>
      {showCalBlockPrompt && (
        <Portal>
          <AskForCalibrationBlockModal setHasBlock={setHasBlock} />
        </Portal>
      )}
      {showWizard && useTrashSurface.current !== null && (
        <Portal>
          <CalibrateTipLength
            robotName={robotName}
            session={tipLengthCalibrationSession}
            closeWizard={handleCloseWizard}
            hasBlock={!useTrashSurface.current}
          />
        </Portal>
      )}
    </>
  )
}

type UncalibratedInfoProps = {|
  hasCalibrated: boolean,
  handleStart: () => void,
  requestStatus: ?string,
|}
function UncalibratedInfo(props: UncalibratedInfoProps): React.Node {
  const { hasCalibrated, handleStart, requestStatus } = props

  const leftChildren = (
    <div>
      <p>{!hasCalibrated ? IS_NOT_CALIBRATED : IS_CALIBRATED}</p>
      <PrimaryButton onClick={handleStart}>
        {requestStatus === RobotApi.PENDING && (
          <Icon name="ot-spinner" height="1em" spin />
        )}
        {requestStatus !== RobotApi.PENDING &&
          (!hasCalibrated ? CALIBRATE_TIP_LENGTH : RECALIBRATE_TIP_LENGTH)}
      </PrimaryButton>
    </div>
  )

  return <CalibrationInfoContent leftChildren={leftChildren} />
}
