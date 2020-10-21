// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import last from 'lodash/last'
import * as RobotApi from '../../robot-api'
import * as Sessions from '../../sessions'

import {
  Icon,
  Flex,
  Box,
  Text,
  SecondaryBtn,
  ALIGN_CENTER,
  SIZE_2,
  SPACING_1,
  SPACING_2,
  SPACING_3,
  BORDER_SOLID_LIGHT,
  COLOR_WARNING,
  FONT_SIZE_BODY_1,
  FONT_WEIGHT_SEMIBOLD,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'

import { Portal } from '../portal'
import { CheckCalibration } from '../CheckCalibration'
import { TitledControl } from '../TitledControl'

import type { State } from '../../types'

export type CheckCalibrationControlProps = {|
  robotName: string,
  disabledReason: string | null,
|}

const CAL_HEALTH_CHECK = 'Calibration Health Check'
const CHECK_HEALTH = 'check health'
const CAL_HEALTH_CHECK_DESCRIPTION =
  'Check the calibration settings for your robot.'
const COULD_NOT_START = 'Could not start Robot Calibration Check'
const PLEASE_TRY_AGAIN =
  'Please try again or contact support if you continue to experience issues'

export function CheckCalibrationControl({
  robotName,
  disabledReason,
}: CheckCalibrationControlProps): React.Node {
  const [showWizard, setShowWizard] = React.useState(false)
  const [dispatch, requestIds] = RobotApi.useDispatchApiRequest()
  const [targetProps, tooltipProps] = useHoverTooltip()

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

  const buttonDisabled =
    Boolean(disabledReason) || requestStatus === RobotApi.PENDING

  React.useEffect(() => {
    if (requestStatus === RobotApi.SUCCESS) setShowWizard(true)
  }, [requestStatus])

  const buttonChildren =
    requestStatus !== RobotApi.PENDING ? (
      <Text>{CHECK_HEALTH}</Text>
    ) : (
      <Icon name="ot-spinner" height="1em" spin />
    )

  // TODO(mc, 2020-06-17): extract alert presentational stuff
  return (
    <>
      <TitledControl
        borderBottom={BORDER_SOLID_LIGHT}
        title={CAL_HEALTH_CHECK}
        description={CAL_HEALTH_CHECK_DESCRIPTION}
        control={
          <SecondaryBtn
            {...targetProps}
            width="12rem"
            onClick={ensureSession}
            disabled={buttonDisabled}
          >
            {buttonChildren}
          </SecondaryBtn>
        }
      >
        {disabledReason !== null && (
          <Tooltip {...tooltipProps}>{disabledReason}</Tooltip>
        )}
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
      </TitledControl>
      {showWizard && (
        <Portal level="top">
          <CheckCalibration
            robotName={robotName}
            closeCalibrationCheck={() => setShowWizard(false)}
          />
        </Portal>
      )}
    </>
  )
}
