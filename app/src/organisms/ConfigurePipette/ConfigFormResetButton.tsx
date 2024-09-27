import { Trans, useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  SecondaryButton,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { Divider } from '/app/atoms/structure'

export interface ButtonProps {
  onClick?: () => unknown
  disabled: boolean
}

export function ConfigFormResetButton(props: ButtonProps): JSX.Element {
  const { onClick, disabled } = props
  const { t } = useTranslation(['shared', 'branded'])

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Trans
        t={t}
        i18nKey="branded:these_are_advanced_settings"
        components={{
          block: (
            <LegacyStyledText
              fontSize={TYPOGRAPHY.fontSizeP}
              paddingBottom={SPACING.spacing4}
            />
          ),
        }}
      />
      <SecondaryButton
        marginTop={SPACING.spacing12}
        marginBottom={SPACING.spacing16}
        onClick={onClick}
        disabled={disabled}
      >
        {t('reset_all')}
      </SecondaryButton>
      <Divider marginY={0} />
    </Flex>
  )
}
