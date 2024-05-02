import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Flex, SPACING, DIRECTION_ROW } from '@opentrons/components'

import { getLocalRobot } from '../../redux/discovery'
import {
  getRobotUpdateAvailable,
  clearRobotUpdateSession,
} from '../../redux/robot-update'
import { useDispatchStartRobotUpdate } from '../../redux/robot-update/hooks'
import { UNREACHABLE } from '../../redux/discovery/constants'

import { MediumButton } from '../../atoms/buttons'
import {
  UpdateRobotSoftware,
  NoUpdateFound,
  ErrorUpdateSoftware,
} from '../../organisms/UpdateRobotSoftware'

import type { State, Dispatch } from '../../redux/types'

export function UpdateRobot(): JSX.Element {
  const history = useHistory()
  const { i18n, t } = useTranslation(['device_settings', 'shared'])
  const localRobot = useSelector(getLocalRobot)
  const robotUpdateType = useSelector((state: State) => {
    return localRobot != null && localRobot.status !== UNREACHABLE
      ? getRobotUpdateAvailable(state, localRobot)
      : null
  })
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const dispatchStartRobotUpdate = useDispatchStartRobotUpdate()
  const dispatch = useDispatch<Dispatch>()

  const [errorString, setErrorString] = React.useState<string | null>(null)

  return (
    <Flex padding={SPACING.spacing40}>
      {errorString !== null ? (
        <ErrorUpdateSoftware errorMessage={errorString}>
          <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing8}>
            <MediumButton
              flex="1"
              buttonType="secondary"
              buttonText={t('cancel_software_update')}
              onClick={() => {
                dispatch(clearRobotUpdateSession())
                history.goBack()
              }}
            />
            <MediumButton
              flex="1"
              onClick={() => {
                setErrorString(null)
                dispatchStartRobotUpdate(robotName)
              }}
              buttonText={i18n.format(t('shared:try_again'), 'capitalize')}
            />
          </Flex>
        </ErrorUpdateSoftware>
      ) : localRobot === null ||
        localRobot.status === UNREACHABLE ||
        robotUpdateType !== 'upgrade' ? (
        <NoUpdateFound onContinue={history.goBack} />
      ) : (
        <UpdateRobotSoftware
          localRobot={localRobot}
          afterError={setErrorString}
        />
      )}
    </Flex>
  )
}
