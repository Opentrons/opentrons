import noop from 'lodash/noop'
import {
  DisabledFields,
  MultiselectFieldValues,
} from '../../ui/steps/selectors'
import {
  getFieldDefaultTooltip,
  getFieldIndeterminateTooltip,
} from '../StepEditForm/utils'
import { FieldPropsByName } from '../StepEditForm/types'
import { StepFieldName } from '../../form-types'
export const makeBatchEditFieldProps = (
  fieldValues: MultiselectFieldValues,
  disabledFields: DisabledFields,
  handleChangeFormInput: (name: string, value: unknown) => void,
  t: any
): FieldPropsByName => {
  const fieldNames: StepFieldName[] = Object.keys(fieldValues)
  return fieldNames.reduce<FieldPropsByName>((acc, name) => {
    const defaultTooltip = getFieldDefaultTooltip(name, t)
    const isIndeterminate = fieldValues[name].isIndeterminate
    const indeterminateTooltip = getFieldIndeterminateTooltip(name, t)
    let tooltipContent = defaultTooltip // Default to the default content (or blank)

    if (isIndeterminate && indeterminateTooltip) {
      tooltipContent = indeterminateTooltip
    }

    if (name in disabledFields) {
      tooltipContent = disabledFields[name] // Use disabled content if field is disabled, override indeterminate tooltip if applicable
    }

    acc[name] = {
      disabled: name in disabledFields,
      name,
      updateValue: value => handleChangeFormInput(name, value),
      value: fieldValues[name].value,
      errorToShow: null,
      onFieldBlur: noop,
      onFieldFocus: noop,
      isIndeterminate: isIndeterminate,
      tooltipContent: tooltipContent,
    }
    return acc
  }, {})
}
