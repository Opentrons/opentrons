// @flow
import * as React from 'react'
import { Field } from 'formik'
import { InputField } from '@opentrons/components'
import { getIsAutopopulated } from '../formikStatus'
import { LABELS, type LabwareFields } from '../fields'
import fieldStyles from './fieldStyles.css'

type InputFieldProps = React.ElementProps<typeof InputField>

type Props = {|
  name: $Keys<LabwareFields>,
  caption?: $PropertyType<InputFieldProps, 'caption'>,
  inputMasks?: Array<(prevValue: string, update: string) => string>,
  units?: $PropertyType<InputFieldProps, 'units'>,
|}

// NOTE(Ian 2019-07-23): per-field hide-when-autopopulated is not yet necessary,
// because sections are laid out to contain groups of autopopulated fields.
// This functionality in TextField may be removed if we clearly don't need it.
const TextField = (props: Props) => {
  const { caption, name, units } = props
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
        // hide if field has been autopopulated
        getIsAutopopulated(props.name, form.status) ? null : (
          <div className={fieldStyles.field_wrapper}>
            <div className={fieldStyles.field_label}>{LABELS[name]}</div>
            <InputField
              {...field}
              caption={caption}
              onChange={makeHandleChange({ field, form })}
              units={units}
            />
          </div>
        )
      }
    </Field>
  )
}

export default TextField
