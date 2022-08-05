import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { SecondaryButton } from '../../atoms/buttons'
import { Divider } from '../../atoms/structure'
import { StyledText } from '../../atoms/text'

export interface ButtonProps {
  onClick?: () => unknown
  disabled: boolean
}

export function ConfigFormResetButton(props: ButtonProps): JSX.Element {
  const { onClick, disabled } = props
  const { t } = useTranslation(['shared', 'device_details'])

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Trans
        t={t}
        i18nKey="device_details:these_are_advanced_settings"
        components={{
          block: (
            <StyledText
              fontSize={TYPOGRAPHY.fontSizeP}
              paddingBottom={SPACING.spacingXS}
            />
          ),
        }}
      />
      <SecondaryButton
        marginTop={SPACING.spacingSM}
        marginBottom={SPACING.spacing4}
        onClick={onClick}
        disabled={disabled}
      >
        {t('reset_all')}
      </SecondaryButton>
      <Divider marginY={0} />
    </Flex>
  )
}
