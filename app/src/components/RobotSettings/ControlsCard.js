// @flow
// "Robot Controls" card
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  Card,
  SecondaryBtn,
  JUSTIFY_SPACE_BETWEEN,
  SPACING_3,
  SIZE_2,
  SIZE_4,
} from '@opentrons/components'

import {
  home,
  fetchLights,
  updateLights,
  getLightsOn,
  ROBOT,
} from '../../robot-controls'
import { restartRobot } from '../../robot-admin'
import { selectors as robotSelectors } from '../../robot'
import { CONNECTABLE } from '../../discovery'
import { LabeledValue, Divider } from '../structure'
import { ToggleBtn } from '../ToggleBtn'
import {
  DISABLED_CANNOT_CONNECT,
  DISABLED_CONNECT_TO_ROBOT,
  DISABLED_PROTOCOL_IS_RUNNING,
} from './constants'

import type { State, Dispatch } from '../../types'
import type { ViewableRobot } from '../../discovery/types'

type Props = {|
  robot: ViewableRobot,
|}

export function ControlsCard(props: Props): React.Node {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const { robot } = props
  const { name: robotName, status } = robot
  const lightsOn = useSelector((state: State) => getLightsOn(state, robotName))
  const isRunning = useSelector(robotSelectors.getIsRunning)
  const notConnectable = status !== CONNECTABLE
  const toggleLights = () => dispatch(updateLights(robotName, !lightsOn))

  React.useEffect(() => {
    dispatch(fetchLights(robotName))
  }, [dispatch, robotName])

  let buttonDisabledReason = null
  if (notConnectable) {
    buttonDisabledReason = DISABLED_CANNOT_CONNECT
  } else if (!robot.connected) {
    buttonDisabledReason = DISABLED_CONNECT_TO_ROBOT
  } else if (isRunning) {
    buttonDisabledReason = DISABLED_PROTOCOL_IS_RUNNING
  }

  const buttonDisabled = Boolean(buttonDisabledReason)

  return (
    <Card title={t('robot_settings.controls.title')}>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} padding={SPACING_3}>
        <LabeledValue
          label={t('robot_settings.controls.home_label')}
          value={t('robot_settings.controls.home_description')}
        />
        <SecondaryBtn
          onClick={() => dispatch(home(robotName, ROBOT))}
          disabled={buttonDisabled}
          width={SIZE_4}
        >
          {t('robot_settings.controls.home_button')}
        </SecondaryBtn>
      </Flex>
      <Divider />
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} padding={SPACING_3}>
        <LabeledValue
          label={t('robot_settings.controls.restart_label')}
          value={t('robot_settings.controls.restart_description')}
        />
        <SecondaryBtn
          onClick={() => dispatch(restartRobot(robotName))}
          disabled={buttonDisabled}
          width={SIZE_4}
        >
          {t('robot_settings.controls.restart_button')}
        </SecondaryBtn>
      </Flex>
      <Divider />
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} padding={SPACING_3}>
        <LabeledValue
          label={t('robot_settings.controls.lights_label')}
          value={t('robot_settings.controls.lights_description')}
        />
        <ToggleBtn
          label={t('robot_settings.controls.lights_label')}
          toggledOn={Boolean(lightsOn)}
          onClick={toggleLights}
          disabled={buttonDisabled}
          size={SIZE_2}
        />
      </Flex>
    </Card>
  )
}
