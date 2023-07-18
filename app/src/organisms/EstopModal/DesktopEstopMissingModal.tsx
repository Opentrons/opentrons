import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { Flex, SPACING, DIRECTION_COLUMN } from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { LegacyModal } from '../../molecules/LegacyModal'

import type { LegacyModalProps } from '../../molecules/LegacyModal'

interface DesktopEstopMissingModalProps {
  isActiveRun: boolean
  robotName: string
  closeModal: () => void
}

export function DesktopEstopMissingModal({
  isActiveRun,
  robotName,
  closeModal,
}: DesktopEstopMissingModalProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const modalProps: LegacyModalProps = {
    type: 'error',
    title: t('estop_missing'),
    onClose: () => closeModal(),
    closeOnOutsideClick: false,
    childrenPadding: isActiveRun ? SPACING.spacing32 : SPACING.spacing24,
    width: '47rem',
  }

  return (
    <LegacyModal
      {...modalProps}
      data-testid={`DesktopEstopMissingModal_${
        isActiveRun ? 'activeRun' : 'inactiveRun'
      }`}
    >
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
        <StyledText as="h1">{t('connect_the_estop_to_continue')}</StyledText>
        <StyledText>
          {t('estop_missing_description', { robotName: robotName })}
        </StyledText>
      </Flex>
    </LegacyModal>
  )
}
