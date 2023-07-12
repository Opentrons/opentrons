import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { Chip } from '../../atoms/Chip'
import { SmallButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { Modal } from '../../molecules/Modal'

import type {
  ModalHeaderBaseProps,
  ModalSize,
} from '../../molecules/Modal/types'

interface EstopPressedModalProps {
  isActiveRun: boolean
  isEngaged: boolean
}

export function EstopPressedModal({
  isActiveRun,
  isEngaged,
}: EstopPressedModalProps): JSX.Element {
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
        gridGap={SPACING.spacing40}
        marginTop={isActiveRun ? SPACING.spacing32 : undefined}
      >
        <StyledText as="p" fontWeight>
          {t('estop_missing_description')}
        </StyledText>
        <Flex
          backgroundColor={isEngaged ? COLORS.red3 : COLORS.green3}
          padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
          borderRadius={BORDERS.borderRadiusSize3}
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_CENTER}
        >
          <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {t('estop')}
          </StyledText>
          <Chip
            type={isEngaged ? 'error' : 'success'}
            text={isEngaged ? t('engaged') : t('disengaged')}
            iconName="connection-status"
            background={false}
          />
        </Flex>
        <SmallButton
          width="100%"
          buttonText={t('resume_robot_operations')}
          disabled={isEngaged}
          onClick={() => console.log('pressed')}
        />
      </Flex>
    </Modal>
  )
}
