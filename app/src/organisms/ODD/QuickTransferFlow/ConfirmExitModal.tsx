import { useTranslation } from 'react-i18next'
import {
  SPACING,
  COLORS,
  LegacyStyledText,
  Flex,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
} from '@opentrons/components'
import { OddModal } from '/app/molecules/OddModal'
import { SmallButton } from '/app/atoms/buttons'

interface ConfirmExitModalProps {
  confirmExit: () => void
  cancelExit: () => void
}

export const ConfirmExitModal = (props: ConfirmExitModalProps): JSX.Element => {
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])

  return (
    <OddModal
      header={{
        title: t('exit_quick_transfer'),
        iconName: 'alert-circle',
        iconColor: COLORS.yellow50,
      }}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing32}
        width="100%"
      >
        <LegacyStyledText css={TYPOGRAPHY.bodyTextRegular}>
          {t('lose_all_progress')}
        </LegacyStyledText>
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
