// RobotSettings card for robot status
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  selectors as robotSelectors,
  connect,
  disconnect,
} from '../../../redux/robot'

import {
  Card,
  SecondaryBtn,
  Flex,
  TEXT_TRANSFORM_CAPITALIZE,
  JUSTIFY_SPACE_BETWEEN,
  SPACING_3,
} from '@opentrons/components'
import { CONNECTABLE } from '../../../redux/discovery'
import { LabeledValue } from '../../../atoms/structure'

import type { Dispatch } from '../../../redux/types'
import type { ViewableRobot } from '../../../redux/discovery/types'

interface Props {
  robot: ViewableRobot
}

export function StatusCard(props: Props): JSX.Element {
  const { robot } = props
  const dispatch = useDispatch<Dispatch>()
  const { t } = useTranslation('robot_connection')

  const connectable = robot.status === CONNECTABLE
  const connected = robot.connected != null && robot.connected
  const sessionStatus = useSelector(robotSelectors.getSessionStatus)
  const connectButtonDisabled = !connectable

  let status = t('connection_status', { context: 'default' })
  if (!connectable) {
    status = t('connection_status', { context: 'not_connectable' })
  } else if (!connected) {
    status = t('connection_status', { context: 'disconnected' })
  } else if (sessionStatus !== '') {
    status = sessionStatus
  }

  const handleClick: React.MouseEventHandler = () => {
    if (connected) {
      dispatch(disconnect())
    } else {
      dispatch(connect(robot.name))
    }
  }

  return (
    <Card title={t('connection_title')}>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} padding={SPACING_3}>
        <LabeledValue
          label={t('connection_label')}
          value={status}
          valueProps={{ textTransform: TEXT_TRANSFORM_CAPITALIZE }}
        />
        <SecondaryBtn onClick={handleClick} disabled={connectButtonDisabled}>
          {connected ? t('disconnect') : t('connect')}
        </SecondaryBtn>
      </Flex>
    </Card>
  )
}
