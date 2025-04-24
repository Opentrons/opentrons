import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  Banner,
  DIRECTION_COLUMN,
  Flex,
  SIZE_3,
  SPACING,
} from '@opentrons/components'

import { ControlledRadioButtonGroup } from '../../molecules/ControlledRadioButtonGroup'

export const PD = 'Protocol Designer'
export const PYTHON = 'Python'
export const PROTOCOL_FORMAT = 'protocol_format'

export function ProtocolFormatSection(): JSX.Element | null {
  const { t } = useTranslation('create_protocol')
  const { trigger } = useFormContext()
  const robotRadioButtons = [
    {
      id: PYTHON,
      buttonLabel: t('python_protocol'),
      buttonValue: PYTHON,
    },
    {
      id: PD,
      buttonLabel: t('pd_protocol'),
      buttonValue: PD,
    },
  ]

  // trigger form validation on mount for when users come back to this section after moving on
  useEffect(() => {
    void trigger([PROTOCOL_FORMAT])
  })

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      height="100%"
      gap={SPACING.spacing24}
    >
      <ControlledRadioButtonGroup
        radioButtons={robotRadioButtons}
        title={t('protocol_format')}
        name={PROTOCOL_FORMAT}
        defaultValue={PYTHON}
        rules={{ required: true }}
      />
      <Banner type="informing" marginBottom={SPACING.spacing16} height={SIZE_3}>
        {t('pd_prompt_warning')}
      </Banner>
    </Flex>
  )
}
