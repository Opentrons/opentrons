import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'

interface StorageLimitReachedErrorModalProps {
  onExit: () => void
}

export const StorageLimitReachedErrorModal = (
  props: StorageLimitReachedErrorModalProps
): JSX.Element => {
  const { i18n, t } = useTranslation(['quick_transfer', 'shared', 'branded'])

  return (
    <OddModal
      header={{
        title: t('storage_limit_reached'),
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
          {t('branded:storage_limit_reached_description')}
        </LegacyStyledText>
        <Flex gridGap={SPACING.spacing8}>
          <SmallButton
            width="100%"
            buttonText={i18n.format(t('shared:exit'), 'capitalize')}
            onClick={props.onExit}
          />
        </Flex>
      </Flex>
    </OddModal>
  )
}
