import * as React from 'react'
import { DropdownMenu, Flex, SPACING } from '@opentrons/components'
import type { Options } from '@opentrons/components'
import type { FieldProps } from '../../pages/Designer/ProtocolSteps/StepForm/types'

export interface DropdownStepFormFieldProps extends FieldProps {
  options: Options
  title: string
}

export const DropdownStepFormField = (
  props: DropdownStepFormFieldProps
): JSX.Element => {
  const { options, value, updateValue, title, errorToShow } = props
  const availableOptionId = options.find(opt => opt.value === value)

  return (
    <Flex padding={SPACING.spacing16}>
      <DropdownMenu
        width="17.5rem"
        error={errorToShow}
        dropdownType="neutral"
        filterOptions={options}
        title={title}
        currentOption={availableOptionId ?? options[0]}
        onClick={value => {
          updateValue(value)
        }}
      />
    </Flex>
  )
}
