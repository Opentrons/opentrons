import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  TEXT_TRANSFORM_UPPERCASE,
} from '@opentrons/components'
import { PrimaryButton, SecondaryButton } from '../../atoms/Buttons'
import { Divider } from '../../atoms/structure'
export interface FormButtonBarProps {
  isResetButton: boolean
  onClick?: () => unknown
  disabled: boolean
}

export function FormButtonBar(props: FormButtonBarProps): JSX.Element {
  const { isResetButton, onClick, disabled } = props
  const { t } = useTranslation('shared')

  return isResetButton ? (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      textTransform={TEXT_TRANSFORM_UPPERCASE}
    >
      <SecondaryButton
        marginTop={SPACING.spacingSM}
        marginBottom={SPACING.spacingSM}
        onClick={onClick}
        disabled={disabled}
      >
        {t('reset_all')}
      </SecondaryButton>
      <Divider />
    </Flex>
  ) : (
    <Flex
      justifyContent={JUSTIFY_CENTER}
      flexDirection={DIRECTION_COLUMN}
      textTransform={TEXT_TRANSFORM_UPPERCASE}
    >
      <PrimaryButton type={'submit'} disabled={disabled}>
        {t('confirm')}
      </PrimaryButton>
    </Flex>
  )
}
