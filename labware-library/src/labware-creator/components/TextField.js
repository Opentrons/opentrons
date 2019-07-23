// @flow
import * as React from 'react'
import { Field } from 'formik'
import { InputField } from '@opentrons/components'
import { LABELS, type LabwareFields } from '../fields'
import fieldStyles from './fieldStyles.css'

type Props = {|
  name: $Keys<LabwareFields>,
  units?: $PropertyType<React.ElementProps<typeof InputField>, 'units'>,
  inputMasks?: Array<(prevValue: string, update: string) => string>,
|}

const TextField = (props: Props) => {
  const { name, units } = props
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
    <div className={fieldStyles.field_wrapper}>
      <div className={fieldStyles.field_label}>{LABELS[name]}</div>
      <Field name={props.name}>
        {({ field, form }) => (
          <InputField
            {...field}
            onChange={makeHandleChange({ field, form })}
            units={units}
          />
        )}
      </Field>
    </div>
  )
}

export default TextField
