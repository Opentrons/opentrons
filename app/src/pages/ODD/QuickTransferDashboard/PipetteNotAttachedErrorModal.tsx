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

interface PipetteNotAttachedErrorModalProps {
  onExit: () => void
  onAttach: () => void
}

export const PipetteNotAttachedErrorModal = (
  props: PipetteNotAttachedErrorModalProps
): JSX.Element => {
  const { i18n, t } = useTranslation(['quick_transfer', 'shared', 'branded'])

  return (
    <OddModal
      header={{
        title: t('branded:attach_a_pipette'),
        iconName: 'alert-circle',
        iconColor: COLORS.red50,
      }}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing32}
        width="100%"
      >
        <LegacyStyledText css={TYPOGRAPHY.bodyTextRegular}>
          {t('branded:attach_a_pipette_for_quick_transfer')}
        </LegacyStyledText>
        <Flex gridGap={SPACING.spacing8}>
          <SmallButton
            width="50%"
            buttonText={i18n.format(t('shared:exit'), 'capitalize')}
            onClick={props.onExit}
            buttonType="secondary"
          />
          <SmallButton
            width="50%"
            buttonText={t('attach_pipette')}
            onClick={props.onAttach}
          />
        </Flex>
      </Flex>
    </OddModal>
  )
}
