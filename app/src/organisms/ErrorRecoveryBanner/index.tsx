import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  Flex,
  Banner,
  DIRECTION_COLUMN,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { getUserId } from '/app/redux/config'
import { useClientDataRecovery } from '/app/resources/client_data'

import type { RecoveryIntent } from '/app/resources/client_data'
import type { StyleProps } from '@opentrons/components'

const CLIENT_DATA_INTERVAL_MS = 5000

export interface UseErrorRecoveryBannerResult {
  showRecoveryBanner: boolean
  recoveryIntent: RecoveryIntent
}

export function useErrorRecoveryBanner(): UseErrorRecoveryBannerResult {
  const { userId, intent } = useClientDataRecovery({
    refetchInterval: CLIENT_DATA_INTERVAL_MS,
  })
  const thisUserId = useSelector(getUserId)

  return {
    showRecoveryBanner: userId !== null && thisUserId !== userId,
    recoveryIntent: intent ?? 'recovering',
  }
}

export interface ErrorRecoveryBannerProps extends StyleProps {
  recoveryIntent: RecoveryIntent
}

export function ErrorRecoveryBanner({
  recoveryIntent,
  ...styleProps
}: ErrorRecoveryBannerProps): JSX.Element {
  const { t } = useTranslation(['error_recovery', 'shared'])

  const buildTitleText = (): string => {
    switch (recoveryIntent) {
      case 'canceling':
        return t('robot_is_canceling_run')
      case 'recovering':
      default:
        return t('robot_is_in_recovery_mode')
    }
  }

  return (
    <Banner type="warning" {...styleProps}>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <StyledText desktopStyle="bodyDefaultSemiBold">
          {buildTitleText()}
        </StyledText>
        <Flex>
          <StyledText
            desktopStyle="bodyDefaultRegular"
            marginRight={SPACING.spacing4}
          >
            {t('another_app_controlling_robot')}
          </StyledText>
        </Flex>
      </Flex>
    </Banner>
  )
}
