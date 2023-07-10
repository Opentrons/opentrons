import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_FLEX_END,
  PrimaryButton,
  SPACING,
} from '@opentrons/components'

import { Banner } from '../../atoms/Banner'
import { StyledText } from '../../atoms/text'
import { LegacyModal } from '../../molecules/LegacyModal'

import type { LegacyModalProps } from '../../molecules/LegacyModal'

interface DesktopEstopModalProps {
  isActiveRun: boolean
  isEngaged: boolean
}

export function DesktopEstopModal({
  isActiveRun,
  isEngaged,
}: DesktopEstopModalProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const modalProps: LegacyModalProps = {
    type: isActiveRun ? 'outlinedError' : 'error',
    title: t('estop_pressed'),
    childrenPadding: isActiveRun ? SPACING.spacing32 : SPACING.spacing24,
    width: '47rem',
  }

  const handleClick = (): void => {
    console.log('resume robot operations')
  }

  return (
    <LegacyModal
      {...modalProps}
      data-testid={`DesktopEstopModal_${
        isActiveRun ? 'activeRun' : 'inactiveRun'
      }`}
    >
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
        <Banner type={isEngaged ? 'error' : 'success'}>
          {isEngaged ? t('estop_engaged') : t('estop_disengaged')}
        </Banner>
        <StyledText as="p" color={COLORS.darkBlack90}>
          {t('estop_description')}
        </StyledText>
        <Flex justifyContent={JUSTIFY_FLEX_END}>
          <PrimaryButton onClick={handleClick} disabled={isEngaged}>
            {t('resume_robot_operations')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </LegacyModal>
  )
}
