// @flow
import * as React from 'react'
import { Link } from 'react-router-dom'
import { Formik, Form } from 'formik'

import startCase from 'lodash/startCase'
import mapValues from 'lodash/mapValues'
import forOwn from 'lodash/forOwn'
import keys from 'lodash/keys'
import pick from 'lodash/pick'
import omit from 'lodash/omit'
import set from 'lodash/set'
import isEmpty from 'lodash/isEmpty'

import FormButtonBar from './FormButtonBar'
import ConfigFormGroup, { FormColumn } from './ConfigFormGroup'

import type {
  Pipette,
  PipetteSettingsField,
  PipetteConfigResponse,
  PipetteConfigFields,
  PipetteConfigRequest,
} from '../../http-api-client'

import type { FormValues } from './ConfigFormGroup'

export type DisplayFieldProps = PipetteSettingsField & {
  name: string,
  displayName: string,
}

type Props = {
  parentUrl: string,
  pipette: Pipette,
  pipetteConfig: PipetteConfigResponse,
  updateConfig: (id: string, PipetteConfigRequest) => mixed,
  showHiddenFields: boolean,
}

const PLUNGER_KEYS = ['top', 'bottom', 'blowout', 'dropTip']
const POWER_KEYS = ['plungerCurrent', 'pickUpCurrent', 'dropTipCurrent']
const TIP_KEYS = ['dropTipSpeed', 'pickUpDistance']

export default class ConfigForm extends React.Component<Props> {
  getFieldsByKey(
    keys: Array<string>,
    fields: PipetteConfigFields
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

  getVisibleFields = (): PipetteConfigFields => {
    if (this.props.showHiddenFields) return this.props.pipetteConfig.fields

    return pick(this.props.pipetteConfig.fields, [
      ...PLUNGER_KEYS,
      ...POWER_KEYS,
      ...TIP_KEYS,
    ])
  }

  getUnknownKeys = (): Array<string> => {
    return keys<string>(
      omit(this.props.pipetteConfig.fields, [
        ...PLUNGER_KEYS,
        ...POWER_KEYS,
        ...TIP_KEYS,
      ])
    )
  }

  handleSubmit = (values: FormValues) => {
    const params = mapValues(values, v => {
      return v === '' ? null : { value: Number(v) }
    })
    this.props.updateConfig(this.props.pipette.id, { fields: { ...params } })
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

  render() {
    const { parentUrl } = this.props
    const fields = this.getVisibleFields()
    const UNKNOWN_KEYS = this.getUnknownKeys()
    const initialValues = mapValues(fields, f => {
      return f.value !== f.default ? f.value.toString() : ''
    })
    const plungerFields = this.getFieldsByKey(PLUNGER_KEYS, fields)
    const powerFields = this.getFieldsByKey(POWER_KEYS, fields)
    const tipFields = this.getFieldsByKey(TIP_KEYS, fields)
    const devFields = this.getFieldsByKey(UNKNOWN_KEYS, fields)

    return (
      <Formik
        onSubmit={this.handleSubmit}
        initialValues={initialValues}
        validate={this.validate}
        validateOnChange={false}
        render={formProps => {
          const { errors, values } = formProps
          const disableSubmit = !isEmpty(errors)
          const handleReset = () =>
            formProps.resetForm(mapValues(values, () => ''))
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
                {this.props.showHiddenFields && (
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
                  },
                  { children: 'cancel', Component: Link, to: parentUrl },
                  { children: 'save', type: 'submit', disabled: disableSubmit },
                ]}
              />
            </Form>
          )
        }}
      />
    )
  }
}
