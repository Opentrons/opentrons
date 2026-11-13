import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'

import type { ReactNode } from 'react'

interface ConfirmExitModalProps {
  confirmExit: () => void
  cancelExit: () => void
}

export const ConfirmExitModal = (props: ConfirmExitModalProps): ReactNode => {
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])

  return (
    <OddModal
      header={{
        title: t('exit_quick_transfer'),
        iconName: 'ot-alert',
        iconColor: COLORS.yellow50,
      }}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing32}
        width="100%"
      >
        <StyledText oddStyle="bodyTextRegular">
          {t('lose_all_progress')}
        </StyledText>
        <Flex gridGap={SPACING.spacing8}>
          <SmallButton
            width="50%"
            buttonText={i18n.format(t('shared:cancel'), 'capitalize')}
            onClick={props.cancelExit}
          />
          <SmallButton
            width="50%"
            buttonText={i18n.format(t('shared:delete'), 'capitalize')}
            onClick={props.confirmExit}
            buttonType="alert"
          />
        </Flex>
      </Flex>
    </OddModal>
  )
}
