import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { DropdownMenu, Flex, SPACING } from '@opentrons/components'
import type { Options } from '@opentrons/components'
import type { FieldProps } from '../../pages/Designer/ProtocolSteps/StepForm/types'

export interface DropdownStepFormFieldProps extends FieldProps {
  options: Options
  title: string
}

export function DropdownStepFormField(
  props: DropdownStepFormFieldProps
): JSX.Element {
  const {
    options,
    value,
    updateValue,
    title,
    errorToShow,
    tooltipContent,
  } = props
  const { t } = useTranslation('tooltip')
  const availableOptionId = options.find(opt => opt.value === value)

  return (
    <Flex padding={SPACING.spacing16}>
      <DropdownMenu
        tooltipText={tooltipContent != null ? t(`${tooltipContent}`) : null}
        width="17.5rem"
        error={errorToShow}
        dropdownType="neutral"
        filterOptions={options}
        title={title}
        currentOption={
          availableOptionId ?? { name: 'Choose option', value: '' }
        }
        onClick={value => {
          updateValue(value)
        }}
      />
    </Flex>
  )
}
