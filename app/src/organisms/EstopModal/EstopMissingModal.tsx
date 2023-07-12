import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { Modal } from '../../molecules/Modal'

import type {
  ModalHeaderBaseProps,
  ModalSize,
} from '../../molecules/Modal/types'

interface EstopMissingModalProps {
  isActiveRun: boolean
  robotName: string
}

export function EstopMissingModal({
  isActiveRun,
  robotName,
}: EstopMissingModalProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const modalHeader: ModalHeaderBaseProps = {
    title: t('estop_missing'),
    iconName: 'ot-alert',
    iconColor: isActiveRun ? COLORS.white : COLORS.red2,
  }
  const modalProps = {
    header: { ...modalHeader },
    modalSize: 'large' as ModalSize,
    isError: isActiveRun,
  }
  return (
    <Modal {...modalProps}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing16}
        marginTop={isActiveRun ? SPACING.spacing32 : undefined}
      >
        <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightBold}>
          {t('connect_estop_to_continue')}
        </StyledText>
        <StyledText as="p">
          {t('estop_missing_description', { robotName: robotName })}
        </StyledText>
      </Flex>
    </Modal>
  )
}
