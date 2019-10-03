// @flow
import * as React from 'react'
import { Field } from 'formik'
import { RadioGroup } from '@opentrons/components'
import { reportFieldEdit } from '../analyticsUtils'
import { getIsHidden } from '../formSelectors'
import { LABELS, type LabwareFields } from '../fields'
import fieldStyles from './fieldStyles.css'

type Props = {|
  name: $Keys<LabwareFields>,
  options: $PropertyType<React.ElementProps<typeof RadioGroup>, 'options'>,
  labelTextClassName?: ?string,
|}

const RadioField = (props: Props) => (
  <Field name={props.name}>
    {({ form, field }) =>
      getIsHidden(props.name, form.values) ? null : (
        <div className={fieldStyles.field_wrapper}>
          <div className={fieldStyles.field_label}>{LABELS[props.name]}</div>
          <RadioGroup
            {...field}
            labelTextClassName={props.labelTextClassName}
            onChange={e => {
              field.onChange(e)
              // do not wait until blur to make radio field 'dirty', so that alerts show up immediately.
              // NOTE: Ian 2019-10-02 this setTimeout seems necessary to avoid a race condition where
              // Formik blurs the field before setting its value, surfacing a transient error
              // (eg "this field is required") which messes up error analytics
              const blurTarget = e.currentTarget
              setTimeout(() => {
                blurTarget.blur()
              }, 0)

              reportFieldEdit({ value: field.value, name: field.name })
            }}
            options={props.options}
          />
        </div>
      )
    }
  </Field>
)

export default RadioField
