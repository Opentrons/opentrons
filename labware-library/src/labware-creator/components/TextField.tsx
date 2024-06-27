import * as React from 'react'
import { Field } from 'formik'
import { InputField } from '@opentrons/components'
import { reportFieldEdit } from '../analyticsUtils'
import { getIsHidden } from '../formSelectors'
import { getLabel } from '../fields'
import type { InputFieldProps } from '@opentrons/components'
import type { LabwareFields } from '../fields'
import type { FieldProps } from 'formik'
import fieldStyles from './fieldStyles.module.css'

interface Props {
  name: keyof LabwareFields
  label?: string
  placeholder?: string
  caption?: InputFieldProps['caption']
  inputMasks?: Array<(prevValue: string, update: string) => string>
  units?: InputFieldProps['units']
}

// NOTE(Ian 2019-07-23): per-field hide-when-autofilled is not yet necessary,
// because sections are laid out to contain groups of autofilled fields.
// This functionality in TextField may be removed if we clearly don't need it.
export const TextField = (props: Props): JSX.Element => {
  const { label, caption, placeholder, units } = props
  const inputMasks = props.inputMasks || []
  // @ts-expect-error(IL, 2021-03-24): formik types need cleanup w LabwareFields
  const makeHandleChange = ({ field, form }) => (
    e: React.FormEvent<HTMLInputElement>
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
      {({ field, form }: FieldProps) =>
        getIsHidden(props.name, form.values) ? null : (
          <div className={fieldStyles.field_wrapper}>
            <label className={fieldStyles.field_label}>
              {label !== undefined ? label : getLabel(props.name, form.values)}
              <InputField
                name={field.name}
                value={field.value}
                caption={caption}
                placeholder={placeholder}
                onChange={makeHandleChange({ field, form })}
                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                  reportFieldEdit({ value: field.value, name: field.name })
                  field.onBlur(e)
                }}
                units={units}
              />
            </label>
          </div>
        )
      }
    </Field>
  )
}
