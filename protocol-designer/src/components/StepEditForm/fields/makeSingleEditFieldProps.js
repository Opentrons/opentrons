// @flow
import { getFieldErrors } from '../../../steplist/fieldLevel'
import {
  getDisabledFields,
  getDefaultsForStepType,
} from '../../../steplist/formLevel'
import { getFieldDefaultTooltip } from '../utils'
import type { StepFieldName, FormData } from '../../../form-types'
import type { FieldProps, FieldPropsByName, FocusHandlers } from '../types'

type ShowFieldErrorParams = {|
  name: StepFieldName,
  focusedField?: StepFieldName,
  dirtyFields?: Array<StepFieldName>,
|}
export const showFieldErrors = ({
  name,
  focusedField,
  dirtyFields,
}: ShowFieldErrorParams): boolean | void | Array<StepFieldName> =>
  !(name === focusedField) && dirtyFields && dirtyFields.includes(name)

export const makeSingleEditFieldProps = (
  focusHandlers: FocusHandlers,
  formData: FormData,
  handleChangeFormInput: (name: string, value: mixed) => void
): FieldPropsByName => {
  const { dirtyFields, blur, focusedField, focus } = focusHandlers

  const fieldNames: Array<string> = Object.keys(
    getDefaultsForStepType(formData.stepType)
  )

  return fieldNames.reduce<FieldPropsByName>((acc, name) => {
    const disabled = formData ? getDisabledFields(formData).has(name) : false
    const value = formData ? formData[name] : null

    const showErrors = showFieldErrors({ name, focusedField, dirtyFields })
    const errors = getFieldErrors(name, value)
    const errorToShow =
      showErrors && errors.length > 0 ? errors.join(', ') : null

    const updateValue = value => {
      handleChangeFormInput(name, value)
    }

    const onFieldBlur = () => {
      blur(name)
    }

    const onFieldFocus = () => {
      focus(name)
    }

    const fieldProps: FieldProps = {
      disabled,
      errorToShow,
      name,
      updateValue,
      value,
      onFieldBlur,
      onFieldFocus,
      tooltipContent: getFieldDefaultTooltip(name),
    }
    return {
      ...acc,
      [name]: fieldProps,
    }
  }, {})
}
