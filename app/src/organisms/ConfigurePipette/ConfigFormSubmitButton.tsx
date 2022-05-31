import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  TEXT_TRANSFORM_UPPERCASE,
  Box,
} from '@opentrons/components'
import { PrimaryButton } from '../../atoms/buttons'
export interface ConfigFormSubmitButtonProps {
  disabled: boolean
}

export function ConfigFormSubmitButton(
  props: ConfigFormSubmitButtonProps
): JSX.Element {
  const { disabled } = props
  const { t } = useTranslation('shared')

  return (
    <Box
      padding={`${SPACING.spacing4} ${SPACING.spacing4} 0 ${SPACING.spacing4}`}
      boxShadow={'0px -4px 12px rgba(0, 0, 0, 0.15)'}
    >
      <Flex
        justifyContent={JUSTIFY_CENTER}
        flexDirection={DIRECTION_COLUMN}
        textTransform={TEXT_TRANSFORM_UPPERCASE}
      >
        <PrimaryButton type={'submit'} disabled={disabled}>
          {t('confirm')}
        </PrimaryButton>
      </Flex>
    </Box>
  )
}
