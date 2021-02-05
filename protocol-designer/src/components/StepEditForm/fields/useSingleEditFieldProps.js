// @flow
import * as React from 'react'
import { getTooltipForField } from '../utils'
import { getFieldErrors } from '../../../steplist/fieldLevel'
import {
  getDisabledFields,
  getDefaultsForStepType,
} from '../../../steplist/formLevel'
import type { StepFieldName, FormData } from '../../../form-types'
import type { FocusHandlers } from '../types'

export type FieldProps = {|
  disabled: boolean,
  name: string,
  updateValue: mixed => void,
  value: mixed,
  errorToShow: ?string,
  tooltipContent?: React.Node,
  onFieldBlur?: () => mixed,
  onFieldFocus?: () => mixed,
  // isIndeterminate?: boolean, // TODO IMMEDIATELY this will be needed in useBatchEditFieldProps
|}

export type FieldPropsByName = {
  [name: StepFieldName]: FieldProps,
  ...
}

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
  formData: FormData, // TODO(IL, 2021-02-04) type this as HydratedFormData. See #3161
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

    const stepType = formData.stepType
    const tooltipContent = getTooltipForField(stepType, name, disabled)

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
      tooltipContent,
      updateValue,
      value,
      onFieldBlur,
      onFieldFocus,
    }
    return {
      ...acc,
      [name]: fieldProps,
    }
  }, {})
}
