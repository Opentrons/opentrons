import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  TEXT_TRANSFORM_UPPERCASE,
} from '@opentrons/components'
import { SecondaryButton } from '../../atoms/buttons'
import { Divider } from '../../atoms/structure'

export interface ButtonProps {
  onClick?: () => unknown
  disabled: boolean
}

export function ConfigFormResetButton(props: ButtonProps): JSX.Element {
  const { onClick, disabled } = props
  const { t } = useTranslation('shared')

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      textTransform={TEXT_TRANSFORM_UPPERCASE}
    >
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
