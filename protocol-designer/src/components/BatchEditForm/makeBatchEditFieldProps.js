// @flow
import type {
  DisabledFields,
  MultiselectFieldValues,
} from '../../ui/steps/selectors'
import { getFieldDefaultTooltip } from '../StepEditForm/utils'
import { getFieldErrors } from '../../steplist/fieldLevel'
import { showFieldErrors } from '../StepEditForm/fields/makeSingleEditFieldProps'
import type { FieldPropsByName, FocusHandlers } from '../StepEditForm/types'
import type { StepFieldName } from '../../form-types'

export const makeBatchEditFieldProps = (
  focusHandlers: FocusHandlers,
  fieldValues: MultiselectFieldValues,
  disabledFields: DisabledFields,
  handleChangeFormInput: (name: string, value: mixed) => void
): FieldPropsByName => {
  const { dirtyFields, blur, focusedField, focus } = focusHandlers

  const fieldNames: Array<StepFieldName> = Object.keys(fieldValues)
  return fieldNames.reduce<FieldPropsByName>((acc, name) => {
    const defaultTooltip = getFieldDefaultTooltip(name)

    const disabled = name in disabledFields
    const value = fieldValues[name].value
    const isIndeterminate = fieldValues[name].isIndeterminate
    const showErrors =
      !isIndeterminate &&
      showFieldErrors({
        name,
        focusedField,
        dirtyFields,
      })
    // indeterminate fields never have field-level errors
    const errors = isIndeterminate ? [] : getFieldErrors(name, value)
    const errorToShow =
      showErrors && errors.length > 0 ? errors.join(', ') : null

    const onFieldBlur = () => {
      blur(name)
    }

    const onFieldFocus = () => {
      focus(name)
    }

    acc[name] = {
      disabled,
      name,
      updateValue: value => handleChangeFormInput(name, value),
      value,
      errorToShow,
      onFieldBlur,
      onFieldFocus,
      isIndeterminate,
      tooltipContent:
        name in disabledFields ? disabledFields[name] : defaultTooltip,
    }
    return acc
  }, {})
}
