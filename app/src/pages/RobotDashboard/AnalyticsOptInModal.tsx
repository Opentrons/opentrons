import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  Flex,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  SPACING,
} from '@opentrons/components'

import { SmallButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { Modal } from '../../molecules/Modal'
import { updateConfigValue } from '../../redux/config'
import { getLocalRobot } from '../../redux/discovery'
import { updateSetting } from '../../redux/robot-settings'

import type { Dispatch } from '../../redux/types'

export const ROBOT_ANALYTICS_SETTING_ID = 'disableLogAggregation'

interface AnalyticsOptInModalProps {
  setShowAnalyticsOptInModal: (showAnalyticsOptInModal: boolean) => void
}

export function AnalyticsOptInModal({
  setShowAnalyticsOptInModal,
}: AnalyticsOptInModalProps): JSX.Element {
  const { t } = useTranslation(['app_settings', 'shared'])
  const dispatch = useDispatch<Dispatch>()

  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'

  const handleCloseModal = (): void => {
    dispatch(
      updateConfigValue(
        'onDeviceDisplaySettings.unfinishedUnboxingFlowRoute',
        null
      )
    )
    setShowAnalyticsOptInModal(false)
  }

  const handleOptIn = (): void => {
    dispatch(updateSetting(robotName, ROBOT_ANALYTICS_SETTING_ID, false))
    dispatch(updateConfigValue('analytics.optedIn', true))
    handleCloseModal()
  }

  const handleOptOut = (): void => {
    dispatch(updateSetting(robotName, ROBOT_ANALYTICS_SETTING_ID, true))
    dispatch(updateConfigValue('analytics.optedIn', false))
    handleCloseModal()
  }

  return (
    <Modal modalSize="medium" header={{ title: t('want_to_help_out') }}>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing12}
          paddingBottom={SPACING.spacing32}
        >
          <StyledText as="p" color={COLORS.grey60}>
            {t('opt_in_description')}
          </StyledText>
        </Flex>
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing8}
          width="100%"
        >
          <SmallButton
            flex="1"
            buttonText={t('opt_out')}
            buttonType="secondary"
            onClick={handleOptOut}
          />
          <SmallButton
            flex="1"
            buttonText={t('opt_in')}
            onClick={handleOptIn}
          />
        </Flex>
      </Flex>
    </Modal>
  )
}
