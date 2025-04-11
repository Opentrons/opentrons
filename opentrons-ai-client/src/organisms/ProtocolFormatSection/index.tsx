import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'
import { ControlledRadioButtonGroup } from '../../molecules/ControlledRadioButtonGroup'

export const PD = 'pd'
export const PYTHON = 'python'
export const PROTOCOL_FORMAT = 'protocol_format'

export function ProtocolFormatSection(): JSX.Element | null {
  const { t } = useTranslation('create_protocol')
  const robotRadioButtons = [
    {
      id: PD,
      buttonLabel: t('pd_protocol'),
      buttonValue: PD,
    },
    {
      id: PYTHON,
      buttonLabel: t('python_protocol'),
      buttonValue: PYTHON,
    },
  ]

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      height="100%"
      gap={SPACING.spacing24}
    >
      <ControlledRadioButtonGroup
        radioButtons={robotRadioButtons}
        title={t('protocol_format_title')}
        name={PROTOCOL_FORMAT}
        defaultValue={PYTHON}
        rules={{ required: true }}
      />

    </Flex>
  )
}