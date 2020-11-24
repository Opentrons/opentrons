// @flow
// RobotSettings card for robot status
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  selectors as robotSelectors,
  actions as robotActions,
} from '../../robot'

import {
  Card,
  SecondaryBtn,
  Icon,
  TEXT_TRANSFORM_CAPITALIZE,
} from '@opentrons/components'
import { CONNECTABLE } from '../../discovery'
import { CardContentHalf } from '../layout'
import { LabeledValue } from '../structure'

import type { Dispatch } from '../../types'
import type { ViewableRobot } from '../../discovery/types'

type Props = {| robot: ViewableRobot |}

export function StatusCard(props: Props): React.Node {
  const { robot } = props
  const dispatch = useDispatch<Dispatch>()
  const { t } = useTranslation()

  const connectable = robot.status === CONNECTABLE
  const connected = robot.connected != null && robot.connected === true
  const sessionStatus = useSelector(robotSelectors.getSessionStatus)
  const connectRequest = useSelector(robotSelectors.getConnectRequest)
  const connectButtonDisabled = !connectable || connectRequest.inProgress

  let status = t('robot_settings.status.default')
  if (!connectable) {
    status = t('robot_settings.status.not_connectable')
  } else if (!connected) {
    status = t('robot_settings.status.disconnected')
  } else if (sessionStatus) {
    status = sessionStatus
  }

  const handleClick = () => {
    if (connected) {
      dispatch(robotActions.disconnect())
    } else {
      dispatch(robotActions.connect(robot.name))
    }
  }

  return (
    <Card title={t('robot_settings.status.title')}>
      <CardContentHalf>
        <LabeledValue
          label={t('robot_settings.status.label')}
          value={status}
          valueProps={{ textTransform: TEXT_TRANSFORM_CAPITALIZE }}
        />
      </CardContentHalf>
      <CardContentHalf>
        <SecondaryBtn onClick={handleClick} disabled={connectButtonDisabled}>
          {connected ? (
            t('robot_settings.disconnect')
          ) : connectRequest.name === robot.name ? (
            <Icon name="ot-spinner" height="1em" spin />
          ) : (
            t('robot_settings.connect')
          )}
        </SecondaryBtn>
      </CardContentHalf>
    </Card>
  )
}
