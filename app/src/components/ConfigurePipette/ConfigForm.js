// @flow
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

import type { FormikProps } from 'formik/@flow-typed'
import type {
  PipetteSettingsField,
  PipetteSettingsFieldsMap,
  PipetteSettingsFieldsUpdate,
} from '../../pipettes/types'

import type { FormValues } from './ConfigFormGroup'

export type DisplayFieldProps = {|
  ...PipetteSettingsField,
  name: string,
  displayName: string,
|}

export type DisplayQuirkFieldProps = {|
  [quirkId: string]: boolean,
  name: string,
  displayName: string,
|}

export type ConfigFormProps = {|
  settings: PipetteSettingsFieldsMap,
  updateInProgress: boolean,
  updateSettings: (fields: PipetteSettingsFieldsUpdate) => mixed,
  closeModal: () => mixed,
  __showHiddenFields: boolean,
|}

const PLUNGER_KEYS = ['top', 'bottom', 'blowout', 'dropTip']
const POWER_KEYS = ['plungerCurrent', 'pickUpCurrent', 'dropTipCurrent']
const TIP_KEYS = ['dropTipSpeed', 'pickUpDistance']
const QUIRK_KEY = 'quirks'

export class ConfigForm extends React.Component<ConfigFormProps> {
  getFieldsByKey(
    keys: Array<string>,
    fields: PipetteSettingsFieldsMap
  ): Array<DisplayFieldProps> {
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

  getKnownQuirks = (): Array<DisplayQuirkFieldProps> => {
    const quirks = this.props.settings[QUIRK_KEY]
    if (!quirks) return []
    const quirkKeys = Object.keys(quirks)
    return quirkKeys.map(name => {
      const value = quirks[name]
      const displayName = startCase(name)
      return {
        [name]: value,
        name,
        displayName,
      }
    })
  }

  getVisibleFields = (): PipetteSettingsFieldsMap => {
    if (this.props.__showHiddenFields) return this.props.settings
    return pick(this.props.settings, [
      ...PLUNGER_KEYS,
      ...POWER_KEYS,
      ...TIP_KEYS,
    ])
  }

  getUnknownKeys = (): Array<string> => {
    return keys<string>(
      omit(this.props.settings, [
        ...PLUNGER_KEYS,
        ...POWER_KEYS,
        ...TIP_KEYS,
        QUIRK_KEY,
      ])
    )
  }

  handleSubmit = (values: FormValues) => {
    const params = mapValues(values, (v: ?(string | boolean)) => {
      if (v === true || v === false) return v
      if (v === '' || v == null) return null
      return Number(v)
    })

    this.props.updateSettings(params)
  }

  getFieldValue(
    key: string,
    fields: Array<DisplayFieldProps>,
    values: FormValues
  ): number {
    const field = fields.find(f => f.name === key)
    const _default = field && field.default
    const value = values[key] || _default
    return Number(value)
  }

  validate = (values: FormValues) => {
    const errors = {}
    const fields = this.getVisibleFields()
    const plungerFields = this.getFieldsByKey(PLUNGER_KEYS, fields)

    // validate all visible fields with min and max
    forOwn(fields, (field, name) => {
      const value = values[name].trim()
      const { min, max } = field
      if (value !== '') {
        const parsed = Number(value)
        if (Number.isNaN(parsed)) {
          set(errors, name, `number required`)
        } else if (
          typeof min === 'number' &&
          typeof max === 'number' &&
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

  getInitialValues = () => {
    const fields = this.getVisibleFields()
    const initialFieldValues = mapValues(fields, f => {
      if (f.value === true || f.value === false) return f.value
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

  render() {
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
          const handleReset = () => {
            const newValues = mapValues(values, v => {
              if (typeof v === 'boolean') {
                // NOTE: all checkbox fields default to checked.
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
