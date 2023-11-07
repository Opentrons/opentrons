import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Flex, SPACING, DIRECTION_ROW } from '@opentrons/components'

import { useDispatchStartRobotUpdate } from '../../redux/robot-update/hooks'

import { getLocalRobot } from '../../redux/discovery'
import {
  getRobotUpdateAvailable,
  clearRobotUpdateSession,
} from '../../redux/robot-update'
import { UNREACHABLE } from '../../redux/discovery/constants'
import {
  getOnDeviceDisplaySettings,
  updateConfigValue,
} from '../../redux/config'
import { MediumButton } from '../../atoms/buttons'
import {
  UpdateRobotSoftware,
  CheckUpdates,
  NoUpdateFound,
  ErrorUpdateSoftware,
} from '../../organisms/UpdateRobotSoftware'

import type { Dispatch, State } from '../../redux/types'

const CHECK_UPDATES_DURATION = 10000 // Note: kj 1/10/2023 Currently set 10 sec later we may use a status from state

export function UpdateRobotDuringOnboarding(): JSX.Element {
  const [
    isShowCheckingUpdates,
    setIsShowCheckingUpdates,
  ] = React.useState<boolean>(true)
  const history = useHistory()
  const { i18n, t } = useTranslation(['device_settings', 'shared'])
  const dispatchStartRobotUpdate = useDispatchStartRobotUpdate()
  const dispatch = useDispatch<Dispatch>()
  const localRobot = useSelector(getLocalRobot)
  const robotUpdateType = useSelector((state: State) => {
    return localRobot != null && localRobot.status !== UNREACHABLE
      ? getRobotUpdateAvailable(state, localRobot)
      : null
  })
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'

  const { unfinishedUnboxingFlowRoute } = useSelector(
    getOnDeviceDisplaySettings
  )

  React.useEffect(() => {
    if (robotUpdateType !== 'upgrade') {
      const checkUpdateTimer = setTimeout(() => {
        setIsShowCheckingUpdates(false)
      }, CHECK_UPDATES_DURATION)
      return () => {
        clearTimeout(checkUpdateTimer)
      }
    } else {
      return () => {}
    }
  }, [])

  const [errorString, setErrorString] = React.useState<string | null>(null)
  const handleSuccessfulUpdate = (): void => {
    if (unfinishedUnboxingFlowRoute === '/welcome') {
      dispatch(
        updateConfigValue(
          'onDeviceDisplaySettings.unfinishedUnboxingFlowRoute',
          '/emergency-stop'
        )
      )
    }
  }

  return (
    <Flex padding={SPACING.spacing40}>
      {errorString !== null ? (
        <ErrorUpdateSoftware errorMessage={errorString}>
          <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing8}>
            <MediumButton
              flex="1"
              buttonType="secondary"
              buttonText={t('proceed_without_updating')}
              onClick={() => {
                dispatch(clearRobotUpdateSession())
                history.push('/emergency-stop')
              }}
            />
            <MediumButton
              flex="1"
              onClick={() => dispatchStartRobotUpdate(robotName)}
              buttonText={i18n.format(t('shared:try_again'), 'capitalize')}
            />
          </Flex>
        </ErrorUpdateSoftware>
      ) : isShowCheckingUpdates && robotUpdateType !== 'upgrade' ? (
        <CheckUpdates />
      ) : localRobot === null ||
        localRobot.status === UNREACHABLE ||
        robotUpdateType !== 'upgrade' ? (
        <NoUpdateFound onContinue={() => history.push('/emergency-stop')} />
      ) : (
        <UpdateRobotSoftware
          localRobot={localRobot}
          afterError={setErrorString}
          beforeCommittingSuccessfulUpdate={handleSuccessfulUpdate}
        />
      )}
    </Flex>
  )
}
