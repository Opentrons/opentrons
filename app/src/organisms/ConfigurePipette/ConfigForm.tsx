import * as React from 'react'
import { Formik, Form } from 'formik'

import startCase from 'lodash/startCase'
import mapValues from 'lodash/mapValues'
import forOwn from 'lodash/forOwn'
import keys from 'lodash/keys'
import pick from 'lodash/pick'
import omit from 'lodash/omit'
import set from 'lodash/set'
import { Box } from '@opentrons/components'
import { ConfigFormResetButton } from './ConfigFormResetButton'
import {
  ConfigFormGroup,
  FormColumn,
  ConfigQuirkGroup,
} from './ConfigFormGroup'

import type { FormikProps } from 'formik'
import type {
  PipetteSettingsField,
  PipetteSettingsFieldsMap,
  PipetteSettingsFieldsUpdate,
} from '../../redux/pipettes/types'

import type { FormValues } from './ConfigFormGroup'

export interface DisplayFieldProps extends PipetteSettingsField {
  name: string
  displayName: string
}

export interface DisplayQuirkFieldProps {
  name: string
  displayName: string
  [quirkId: string]: boolean | string
}

export interface ConfigFormProps {
  settings: PipetteSettingsFieldsMap
  updateInProgress: boolean
  updateSettings: (fields: PipetteSettingsFieldsUpdate) => unknown
  groupLabels: string[]
  __showHiddenFields: boolean
  configFormRef: React.Ref<RefObject>
}

export interface RefObject {
  handleSubmit: (values: FormValues) => void
}

const PLUNGER_KEYS = ['top', 'bottom', 'blowout', 'dropTip']
const POWER_KEYS = ['plungerCurrent', 'pickUpCurrent', 'dropTipCurrent']
const TIP_KEYS = ['dropTipSpeed', 'pickUpDistance']
const QUIRK_KEY = 'quirks'

export const ConfigForm = React.forwardRef(
  (props: ConfigFormProps, ref: React.Ref<RefObject>) => {
    const getFieldsByKey = (
      keys: string[],
      fields: PipetteSettingsFieldsMap
    ): DisplayFieldProps[] => {
      return keys.map(k => {
        const field = fields[k]
        const displayName = startCase(k)
        const name = k
        return {
          ...field,
          name,
          displayName,
        }
      })
    }

    const getKnownQuirks = (): DisplayQuirkFieldProps[] => {
      const quirks = props.settings[QUIRK_KEY]
      if (!quirks) return []
      const quirkKeys = Object.keys(quirks)
      return quirkKeys.map<DisplayQuirkFieldProps>((name: string) => {
        const value = quirks[name]
        const displayName = startCase(name)
        return {
          [name]: value,
          name,
          displayName,
        }
      })
    }

    const getVisibleFields: () => PipetteSettingsFieldsMap = () => {
      if (props.__showHiddenFields) return props.settings
      return pick(props.settings, [...PLUNGER_KEYS, ...POWER_KEYS, ...TIP_KEYS])
    }

    const getUnknownKeys: () => string[] = () => {
      return keys(
        omit(props.settings, [
          ...PLUNGER_KEYS,
          ...POWER_KEYS,
          ...TIP_KEYS,
          QUIRK_KEY,
        ])
      )
    }

    React.useImperativeHandle(props.configFormRef, () => ({ handleSubmit }))

    const handleSubmit = (values: FormValues): void => {
      const params = mapValues<FormValues, number | boolean | null>(
        values,
        v => {
          if (v === true || v === false) return v
          if (v === '' || v == null) return null
          return Number(v)
        }
      )

      // @ts-expect-error TODO updateSettings type doesn't include boolean for values of params, but they could be returned.
      this.props.updateSettings(params)
    }

    const getFieldValue = (
      key: string,
      fields: DisplayFieldProps[],
      values: FormValues
    ): number => {
      const field = fields.find(f => f.name === key)
      const _default = field && field.default
      const value = values[key] || _default
      return Number(value)
    }

    const validate = (values: FormValues): {} => {
      const errors = {}
      const fields = getVisibleFields()
      const plungerFields = getFieldsByKey(PLUNGER_KEYS, fields)

      // validate all visible fields with min and max
      forOwn(fields, (field, name) => {
        // @ts-expect-error TODO: value needs to be of type string here, but technically that's not prover
        const value = values[name].trim()
        const { min, max } = field
        if (value !== '') {
          const parsed = Number(value)
          if (Number.isNaN(parsed)) {
            set(errors, name, `number required`)
          } else if (
            typeof min === 'number' &&
            typeof max === 'number' &&
            // TODO(bc, 2021-05-18): this should probably be (parsed < min || parsed > max) so we're not accidentally comparing a string to a number
            (parsed < min || value > max)
          ) {
            set(errors, name, `Min ${min} / Max ${max}`)
          }
        }
      })

      const plungerGroupError =
        'Please ensure the following: \n top > bottom > blowout > droptip'
      const top = getFieldValue('top', plungerFields, values)
      const bottom = getFieldValue('bottom', plungerFields, values)
      const blowout = getFieldValue('blowout', plungerFields, values)
      const dropTip = getFieldValue('dropTip', plungerFields, values)
      if (top <= bottom || bottom <= blowout || blowout <= dropTip) {
        set(errors, 'plungerError', plungerGroupError)
      }

      return errors
    }

    const getInitialValues = (): FormValues => {
      const fields = getVisibleFields()
      const initialFieldValues = mapValues<
        PipetteSettingsFieldsMap,
        string | boolean
      >(fields, f => {
        // @ts-expect-error TODO: PipetteSettingsFieldsMap doesn't include a boolean value, despite checking for it here
        if (f.value === true || f.value === false) return f.value
        // @ts-expect-error(sa, 2021-05-27): avoiding src code change, use optional chain to access f.value
        return f.value !== f.default ? f.value.toString() : ''
      })
      const initialQuirkValues = props.settings[QUIRK_KEY]
      const initialValues = Object.assign(
        {},
        initialFieldValues,
        initialQuirkValues
      )

      return initialValues
    }

    const { updateInProgress } = props
    const fields = getVisibleFields()
    const UNKNOWN_KEYS = getUnknownKeys()
    const plungerFields = getFieldsByKey(PLUNGER_KEYS, fields)
    const powerFields = getFieldsByKey(POWER_KEYS, fields)
    const tipFields = getFieldsByKey(TIP_KEYS, fields)
    const quirkFields = getKnownQuirks()
    const quirksPresent = quirkFields.length > 0
    const devFields = getFieldsByKey(UNKNOWN_KEYS, fields)
    const initialValues = getInitialValues()

    return (
      <Formik
        onSubmit={handleSubmit}
        initialValues={initialValues}
        validate={validate}
        validateOnChange={false}
      >
        {(formProps: FormikProps<FormValues>) => {
          const { errors, values } = formProps
          const handleReset = (): void => {
            const newValues = mapValues(values, v => {
              if (typeof v === 'boolean') {
                // NOTE: checkbox fields don't have defaults from the API b/c they come in from `quirks`
                // For now, we'll reset all checkboxes to true
                return true
              }
              return ''
            })
            formProps.resetForm({ values: newValues })
          }
          return (
            <Box overflowY="scroll">
              <Form>
                <ConfigFormResetButton
                  onClick={handleReset}
                  disabled={updateInProgress}
                />
                <FormColumn>
                  <ConfigFormGroup
                    groupLabel={props.groupLabels[0]}
                    groupError={errors.plungerError}
                    formFields={plungerFields}
                  />
                  <ConfigFormGroup
                    groupLabel={props.groupLabels[1]}
                    formFields={tipFields}
                  />
                  {quirksPresent && <ConfigQuirkGroup quirks={quirkFields} />}
                  {props.__showHiddenFields && (
                    <ConfigFormGroup
                      groupLabel={props.groupLabels[2]}
                      formFields={devFields}
                    />
                  )}
                </FormColumn>
                <FormColumn>
                  <ConfigFormGroup
                    groupLabel={props.groupLabels[3]}
                    formFields={powerFields}
                  />
                </FormColumn>
              </Form>
            </Box>
          )
        }}
      </Formik>
    )
  }
)
