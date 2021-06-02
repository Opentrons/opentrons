import * as React from 'react'
import { Formik, Form } from 'formik'

import startCase from 'lodash/startCase'
import mapValues from 'lodash/mapValues'
import forOwn from 'lodash/forOwn'
import keys from 'lodash/keys'
import pick from 'lodash/pick'
import omit from 'lodash/omit'
import set from 'lodash/set'
import isEmpty from 'lodash/isEmpty'

import { Icon } from '@opentrons/components'
import { FormButtonBar } from './FormButtonBar'
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
  closeModal: () => unknown
  __showHiddenFields: boolean
}

const PLUNGER_KEYS = ['top', 'bottom', 'blowout', 'dropTip']
const POWER_KEYS = ['plungerCurrent', 'pickUpCurrent', 'dropTipCurrent']
const TIP_KEYS = ['dropTipSpeed', 'pickUpDistance']
const QUIRK_KEY = 'quirks'

export class ConfigForm extends React.Component<ConfigFormProps> {
  getFieldsByKey(
    keys: string[],
    fields: PipetteSettingsFieldsMap
  ): DisplayFieldProps[] {
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

  getKnownQuirks = (): DisplayQuirkFieldProps[] => {
    const quirks = this.props.settings[QUIRK_KEY]
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

  getVisibleFields: () => PipetteSettingsFieldsMap = () => {
    if (this.props.__showHiddenFields) return this.props.settings
    return pick(this.props.settings, [
      ...PLUNGER_KEYS,
      ...POWER_KEYS,
      ...TIP_KEYS,
    ])
  }

  getUnknownKeys: () => string[] = () => {
    return keys(
      omit(this.props.settings, [
        ...PLUNGER_KEYS,
        ...POWER_KEYS,
        ...TIP_KEYS,
        QUIRK_KEY,
      ])
    )
  }

  handleSubmit: (values: FormValues) => void = values => {
    const params = mapValues<FormValues, number | boolean | null>(values, v => {
      if (v === true || v === false) return v
      if (v === '' || v == null) return null
      return Number(v)
    })

    // @ts-expect-error TODO updateSettings type doesn't include boolean for values of params, but they could be returned.
    this.props.updateSettings(params)
  }

  getFieldValue(
    key: string,
    fields: DisplayFieldProps[],
    values: FormValues
  ): number {
    const field = fields.find(f => f.name === key)
    const _default = field && field.default
    const value = values[key] || _default
    return Number(value)
  }

  validate = (values: FormValues): {} => {
    const errors = {}
    const fields = this.getVisibleFields()
    const plungerFields = this.getFieldsByKey(PLUNGER_KEYS, fields)

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
    const top = this.getFieldValue('top', plungerFields, values)
    const bottom = this.getFieldValue('bottom', plungerFields, values)
    const blowout = this.getFieldValue('blowout', plungerFields, values)
    const dropTip = this.getFieldValue('dropTip', plungerFields, values)
    if (top <= bottom || bottom <= blowout || blowout <= dropTip) {
      set(errors, 'plungerError', plungerGroupError)
    }

    return errors
  }

  getInitialValues: () => FormValues = () => {
    const fields = this.getVisibleFields()
    const initialFieldValues = mapValues<
      PipetteSettingsFieldsMap,
      string | boolean
    >(fields, f => {
      // @ts-expect-error TODO: PipetteSettingsFieldsMap doesn't include a boolean value, despite checking for it here
      if (f.value === true || f.value === false) return f.value
      // @ts-expect-error(sa, 2021-05-27): avoiding src code change, use optional chain to access f.value
      return f.value !== f.default ? f.value.toString() : ''
    })
    const initialQuirkValues = this.props.settings[QUIRK_KEY]
    const initialValues = Object.assign(
      {},
      initialFieldValues,
      initialQuirkValues
    )

    return initialValues
  }

  render(): JSX.Element {
    const { updateInProgress, closeModal } = this.props
    const fields = this.getVisibleFields()
    const UNKNOWN_KEYS = this.getUnknownKeys()
    const plungerFields = this.getFieldsByKey(PLUNGER_KEYS, fields)
    const powerFields = this.getFieldsByKey(POWER_KEYS, fields)
    const tipFields = this.getFieldsByKey(TIP_KEYS, fields)
    const quirkFields = this.getKnownQuirks()
    const quirksPresent = quirkFields.length > 0
    const devFields = this.getFieldsByKey(UNKNOWN_KEYS, fields)
    const initialValues = this.getInitialValues()

    return (
      <Formik
        onSubmit={this.handleSubmit}
        initialValues={initialValues}
        validate={this.validate}
        validateOnChange={false}
      >
        {(formProps: FormikProps<FormValues>) => {
          const { errors, values } = formProps
          const disableSubmit = !isEmpty(errors)
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
            <Form>
              <FormColumn>
                <ConfigFormGroup
                  groupLabel="Plunger Positions"
                  groupError={errors.plungerError}
                  formFields={plungerFields}
                />
                <ConfigFormGroup
                  groupLabel="Power / Force"
                  formFields={powerFields}
                />
              </FormColumn>
              <FormColumn>
                <ConfigFormGroup
                  groupLabel="Tip Pickup / Drop"
                  formFields={tipFields}
                />
                {quirksPresent && (
                  <ConfigQuirkGroup
                    groupLabel="Pipette Quirks"
                    quirks={quirkFields}
                  />
                )}
                {this.props.__showHiddenFields && (
                  <ConfigFormGroup
                    groupLabel="For Dev Use Only"
                    formFields={devFields}
                  />
                )}
              </FormColumn>
              <FormButtonBar
                buttons={[
                  {
                    children: 'reset all',
                    onClick: handleReset,
                    disabled: updateInProgress,
                  },
                  {
                    children: 'cancel',
                    onClick: closeModal,
                    disabled: updateInProgress,
                  },
                  {
                    type: 'submit',
                    disabled: disableSubmit || updateInProgress,
                    children: updateInProgress ? (
                      <Icon name="ot-spinner" height="1em" spin />
                    ) : (
                      'save'
                    ),
                  },
                ]}
              />
            </Form>
          )
        }}
      </Formik>
    )
  }
}
