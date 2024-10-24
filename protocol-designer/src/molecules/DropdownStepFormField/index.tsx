import { useTranslation } from 'react-i18next'
import { DropdownMenu, Flex, SPACING } from '@opentrons/components'
import type { Options } from '@opentrons/components'
import type { FieldProps } from '../../pages/Designer/ProtocolSteps/StepForm/types'

export interface DropdownStepFormFieldProps extends FieldProps {
  options: Options
  title: string
  addPadding?: boolean
  width?: string
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
    addPadding = true,
    width = '17.5rem',
    onFieldFocus,
    onFieldBlur,
  } = props
  const { t } = useTranslation('tooltip')
  const availableOptionId = options.find(opt => opt.value === value)

  return (
    <Flex padding={addPadding ? SPACING.spacing16 : 0}>
      <DropdownMenu
        tooltipText={tooltipContent != null ? t(`${tooltipContent}`) : null}
        width={width}
        error={errorToShow}
        dropdownType="neutral"
        filterOptions={options}
        title={title}
        onBlur={onFieldBlur}
        onFocus={onFieldFocus}
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
