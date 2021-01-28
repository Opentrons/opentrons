// @flow
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getTooltipForField } from '../utils'
import { actions } from '../../../steplist'
import { selectors as stepFormSelectors } from '../../../step-forms'
import { getFieldErrors, maskField } from '../../../steplist/fieldLevel'
import { getDisabledFields } from '../../../steplist/formLevel'
import type { StepFieldName } from '../../../form-types'

export type FieldProps = {|
  disabled: boolean,
  name: string,
  updateValue: mixed => void,
  value: mixed,
  errorToShow: ?string,
  tooltipContent?: React.Node,
  onFieldBlur?: () => mixed,
  onFieldFocus?: () => mixed,
|}

export type FieldPropsByName = {
  [name: StepFieldName]: FieldProps,
  ...,
}

type ShowFieldErrorParams = {
  name: StepFieldName,
  focusedField?: StepFieldName,
  dirtyFields?: Array<StepFieldName>,
}
export const showFieldErrors = ({
  name,
  focusedField,
  dirtyFields,
}: ShowFieldErrorParams): boolean | void | Array<StepFieldName> =>
  !(name === focusedField) && dirtyFields && dirtyFields.includes(name)

export const useSingleEditFieldProps = (): FieldPropsByName | null => {
  const [dirtyFields, setDirtyFields] = React.useState<Array<StepFieldName>>([])
  const [focusedField, setFocusedField] = React.useState<StepFieldName>(null)

  const dispatch = useDispatch()
  const formData = useSelector(stepFormSelectors.getUnsavedForm)

  if (formData == null) return null

  // TODO IMMEDIATELY: explicit names, this omit is a HACK. Must support all stepTypes.
  const fieldNames: Array<string> = Object.keys(formData).filter(
    k => !['id', 'stepType'].includes(k)
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
      setFocusedField(null)
    }

    const onFieldFocus = () => {
      setDirtyFields([...dirtyFields, name])
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
