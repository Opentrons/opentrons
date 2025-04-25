import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { DIRECTION_ROW, Flex, SPACING } from '@opentrons/components'

import { MediumButton } from '/app/atoms/buttons'
import {
  CheckUpdates,
  ErrorUpdateSoftware,
  NoUpdateFound,
  UpdateRobotSoftware,
} from '/app/organisms/UpdateRobotSoftware'
import {
  getOnDeviceDisplaySettings,
  updateConfigValue,
} from '/app/redux/config'
import { getLocalRobot } from '/app/redux/discovery'
import { UNREACHABLE } from '/app/redux/discovery/constants'
import {
  clearRobotUpdateSession,
  getRobotUpdateAvailable,
} from '/app/redux/robot-update'
import { useDispatchStartRobotUpdate } from '/app/redux/robot-update/hooks'

import type { Dispatch, State } from '/app/redux/types'

const CHECK_UPDATES_DURATION = 10000 // Note: kj 1/10/2023 Currently set 10 sec later we may use a status from state

export function UpdateRobotDuringOnboarding(): JSX.Element {
  const [isShowCheckingUpdates, setIsShowCheckingUpdates] = useState<boolean>(
    true
  )
  const navigate = useNavigate()
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

  useEffect(() => {
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

  const [errorString, setErrorString] = useState<string | null>(null)
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
                navigate('/emergency-stop')
              }}
            />
            <MediumButton
              flex="1"
              onClick={() => {
                dispatchStartRobotUpdate(robotName)
              }}
              buttonText={i18n.format(t('shared:try_again'), 'capitalize')}
            />
          </Flex>
        </ErrorUpdateSoftware>
      ) : isShowCheckingUpdates && robotUpdateType !== 'upgrade' ? (
        <CheckUpdates />
      ) : localRobot === null ||
        localRobot.status === UNREACHABLE ||
        robotUpdateType !== 'upgrade' ? (
        <NoUpdateFound
          onContinue={() => {
            navigate('/emergency-stop')
          }}
        />
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
