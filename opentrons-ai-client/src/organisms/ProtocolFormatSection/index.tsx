import { useEffect } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Banner, DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'

import { ControlledRadioButtonGroup } from '/ai-client/molecules/ControlledRadioButtonGroup'
import { PD, PROTOCOL_FORMAT, PYTHON } from '/ai-client/resources/constants'

export function ProtocolFormatSection(): JSX.Element | null {
  const { t } = useTranslation('create_protocol')
  const { trigger, control } = useFormContext()
  const selectedFormat = useWatch({
    control,
    name: PROTOCOL_FORMAT,
    defaultValue: PYTHON,
  })

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
      {/* Only show banner when Protocol Designer is selected */}
      {selectedFormat === PD ? (
        <Banner type="informing" marginBottom={SPACING.spacing16} height="4rem">
          {t('pd_prompt_warning')}
        </Banner>
      ) : null}
    </Flex>
  )
}
