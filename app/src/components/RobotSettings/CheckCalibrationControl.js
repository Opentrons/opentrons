// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import last from 'lodash/last'
import * as RobotApi from '../../robot-api'
import * as Sessions from '../../sessions'

import {
  OutlineButton,
  Icon,
  Flex,
  Box,
  Text,
  ALIGN_CENTER,
  ALIGN_START,
  SPACING_AUTO,
  SIZE_2,
  SPACING_1,
  SPACING_2,
  SPACING_3,
  BORDER_SOLID_LIGHT,
  COLOR_WARNING,
  FONT_SIZE_BODY_1,
  FONT_WEIGHT_SEMIBOLD,
} from '@opentrons/components'

import { Portal } from '../portal'
import { CheckCalibration } from '../CheckCalibration'

import type { State } from '../../types'

export type CheckCalibrationControlProps = {|
  robotName: string,
  disabled: boolean,
|}

const CHECK = 'Check'
const CHECK_ROBOT_CAL = 'Check robot calibration'
const CHECK_ROBOT_CAL_DESCRIPTION = "Check the robot's calibration state"
const COULD_NOT_START = 'Could not start Robot Calibration Check'
const PLEASE_TRY_AGAIN =
  'Please try again or contact support if you continue to experience issues'

export function CheckCalibrationControl({
  robotName,
  disabled,
}: CheckCalibrationControlProps): React.Node {
  const [showWizard, setShowWizard] = React.useState(false)
  const [dispatch, requestIds] = RobotApi.useDispatchApiRequest()
  const requestState = useSelector((state: State) => {
    const reqId = last(requestIds) ?? null
    return RobotApi.getRequestById(state, reqId)
  })
  const requestStatus = requestState?.status ?? null

  const ensureSession = () => {
    dispatch(
      Sessions.ensureSession(robotName, Sessions.SESSION_TYPE_CALIBRATION_CHECK)
    )
  }

  const buttonDisabled = disabled || requestStatus === RobotApi.PENDING
  const buttonChildren =
    requestStatus !== RobotApi.PENDING ? (
      CHECK
    ) : (
      <Icon name="ot-spinner" height="1em" spin />
    )

  React.useEffect(() => {
    if (requestStatus === RobotApi.SUCCESS) setShowWizard(true)
  }, [requestStatus])

  // TODO(mc, 2020-06-17): extract all this presentational stuff into some sort
  // of replacement for LabeledControl that allows full-width children
  return (
    <>
      <Box
        fontSize={FONT_SIZE_BODY_1}
        padding={SPACING_3}
        borderBottom={BORDER_SOLID_LIGHT}
      >
        <Flex alignItems={ALIGN_START}>
          <Box marginRight={SPACING_AUTO}>
            <Text
              as="h4"
              fontWeight={FONT_WEIGHT_SEMIBOLD}
              marginBottom={SPACING_2}
            >
              {CHECK_ROBOT_CAL}
            </Text>
            <Text>{CHECK_ROBOT_CAL_DESCRIPTION}</Text>
          </Box>
          <Box paddingTop={SPACING_1}>
            <OutlineButton disabled={buttonDisabled} onClick={ensureSession}>
              {buttonChildren}
            </OutlineButton>
          </Box>
        </Flex>
        {requestState && requestState.status === RobotApi.FAILURE && (
          <Flex
            alignItems={ALIGN_CENTER}
            marginTop={SPACING_3}
            color={COLOR_WARNING}
          >
            <Icon name="alert-circle" width={SIZE_2} />
            <Box marginLeft={SPACING_2} fontSize={FONT_SIZE_BODY_1}>
              <Text fontWeight={FONT_WEIGHT_SEMIBOLD} marginBottom={SPACING_1}>
                {COULD_NOT_START}:{' '}
                {RobotApi.getErrorResponseMessage(requestState.error)}
              </Text>
              <Text>{PLEASE_TRY_AGAIN}</Text>
            </Box>
          </Flex>
        )}
      </Box>
      {showWizard && (
        <Portal>
          <CheckCalibration
            robotName={robotName}
            closeCalibrationCheck={() => setShowWizard(false)}
          />
        </Portal>
      )}
    </>
  )
}
