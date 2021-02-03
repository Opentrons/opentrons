// @flow
import assert from 'assert'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getTooltipForField } from '../utils'
import { actions } from '../../../steplist'
import { selectors as stepFormSelectors } from '../../../step-forms'
import { getFieldErrors, maskField } from '../../../steplist/fieldLevel'
import {
  getDisabledFields,
  getDefaultsForStepType,
} from '../../../steplist/formLevel'
import type { StepFieldName } from '../../../form-types'
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

export const useSingleEditFieldProps = (
  focusHandlers: FocusHandlers
): FieldPropsByName | null => {
  const { dirtyFields, blur, focusedField, focus } = focusHandlers

  const dispatch = useDispatch()
  const formData = useSelector(stepFormSelectors.getUnsavedForm)

  if (formData == null) {
    assert(
      false,
      'useSingleEditFieldProps expected getUnsavedForm to not be null'
    )
    return null
  }

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

    const updateValue = val => {
      const maskedValue = maskField(name, val)
      dispatch(actions.changeFormInput({ update: { [name]: maskedValue } }))
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
