// @flow
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { push } from 'connected-react-router'
import { ModalPage } from '@opentrons/components'
import type { State, Dispatch } from '../../types'
import {
  fetchRobotCalibrationCheckSession,
  endRobotCalibrationCheckSession,
  getRobotCalibrationCheckSession,
} from '../../calibration'
import { createLogger } from '../../logger'

import { CompleteConfirmation } from './CompleteConfirmation'
import styles from './styles.css'

const log = createLogger(__filename)

const ROBOT_CALIBRATION_CHECK_SUBTITLE = 'Check deck calibration'

type CheckDeckProps = {|
  parentUrl: string,
  robotName: string,
|}
export function CheckDeck(props: CheckDeckProps) {
  const { robotName, parentUrl } = props
  const dispatch = useDispatch<Dispatch>()
  const robotCalibrationCheckSessionData = useSelector((state: State) =>
    getRobotCalibrationCheckSession(state, robotName)
  )
  React.useEffect(() => {
    dispatch(fetchRobotCalibrationCheckSession(robotName))
  }, [dispatch, robotName])

  function exit() {
    dispatch(endRobotCalibrationCheckSession(robotName))
    dispatch(push(parentUrl))
  }

  log.info('robot calibration check session data: ', robotCalibrationCheckSessionData || {})
  return (
    <ModalPage
      titleBar={{
        title: ROBOT_CALIBRATION_CHECK_SUBTITLE,
        back: { onClick: exit },
      }}
      contentsClassName={styles.modal_contents}
    >
      <CompleteConfirmation robotName={robotName} exit={exit} />
    </ModalPage>
  )
}
