import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  SPACING,
  COLORS,
  StyledText,
  Flex,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
} from '@opentrons/components'
import { Modal } from '../../molecules/Modal'
import { SmallButton } from '../../atoms/buttons'

interface ConfirmExitModalProps {
  confirmExit: () => void
  cancelExit: () => void
}

export const ConfirmExitModal = (props: ConfirmExitModalProps): JSX.Element => {
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])

  return (
    <Modal
      header={{
        title: t('exit_quick_transfer'),
        iconName: 'alert-circle',
        iconColor: COLORS.yellow50,
      }}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing10}
        width="100%"
      >
        <StyledText css={TYPOGRAPHY.bodyTextRegular}>
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
    </Modal>
  )
}
