// @flow
import * as React from 'react'
import { Field } from 'formik'
import { InputField } from '@opentrons/components'
import { reportFieldEdit } from '../analyticsUtils'
import { getIsHidden } from '../formSelectors'
import { LABELS, type LabwareFields } from '../fields'
import fieldStyles from './fieldStyles.css'

type InputFieldProps = React.ElementProps<typeof InputField>

type Props = {|
  name: $Keys<LabwareFields>,
  placeholder?: string,
  caption?: $PropertyType<InputFieldProps, 'caption'>,
  inputMasks?: Array<(prevValue: string, update: string) => string>,
  units?: $PropertyType<InputFieldProps, 'units'>,
|}

// NOTE(Ian 2019-07-23): per-field hide-when-autofilled is not yet necessary,
// because sections are laid out to contain groups of autofilled fields.
// This functionality in TextField may be removed if we clearly don't need it.
export const TextField = (props: Props): React.Node => {
  const { caption, name, placeholder, units } = props
  const inputMasks = props.inputMasks || []
  const makeHandleChange = ({ field, form }) => (
    e: SyntheticEvent<HTMLInputElement>
  ) => {
    const prevValue = field.value
    const rawValue = e.currentTarget.value
    const nextValue = inputMasks.reduce(
      (acc, maskFn) => maskFn(prevValue, acc),
      rawValue
    )
    form.setFieldValue(props.name, nextValue)
  }
  return (
    <Field name={props.name}>
      {({ field, form }) =>
        getIsHidden(props.name, form.values) ? null : (
          <div className={fieldStyles.field_wrapper}>
            <div className={fieldStyles.field_label}>{LABELS[name]}</div>
            <InputField
              name={field.name}
              value={field.value}
              caption={caption}
              placeholder={placeholder}
              onChange={makeHandleChange({ field, form })}
              onBlur={(e: SyntheticEvent<HTMLInputElement>) => {
                reportFieldEdit({ value: field.value, name: field.name })
                field.onBlur(e)
              }}
              units={units}
            />
          </div>
        )
      }
    </Field>
  )
}
