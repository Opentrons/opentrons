// @flow
import * as React from 'react'
import { Field } from 'formik'
import { RadioGroup } from '@opentrons/components'
import { LABELS, type LabwareFields, type Options } from '../fields'
import fieldStyles from './fieldStyles.css'

type Props = {|
  name: $Keys<LabwareFields>,
  options: Options,
|}

const RadioField = (props: Props) => (
  <div className={fieldStyles.field_wrapper}>
    <div className={fieldStyles.field_label}>{LABELS[props.name]}</div>
    <Field name={props.name}>
      {({ form, field }) => (
        <RadioGroup
          {...field}
          onChange={e => {
            field.onChange(e)
            // do not wait until blur to make radio field 'dirty'
            field.onBlur(e)
          }}
          options={props.options}
          inline
        />
      )}
    </Field>
  </div>
)

export default RadioField
