// @flow
import * as React from 'react'
import {Link} from 'react-router-dom'
import {Formik} from 'formik'
import startCase from 'lodash/startCase'
import mapValues from 'lodash/mapValues'
import FormButtonBar from './FormButtonBar'
import ConfigFormGroup, {FormColumn} from './ConfigFormGroup'

import type {
  Pipette,
  PipetteSettingsField,
  PipetteConfigResponse,
  PipetteConfigFields,
} from '../../http-api-client'

export type DisplayFieldProps = PipetteSettingsField & {
  name: string,
  displayName: string,
}

type Props = {
  parentUrl: string,
  pipette: Pipette,
  pipetteConfig: PipetteConfigResponse,
}

const PLUNGER_KEYS = ['top', 'bottom', 'blowout', 'dropTip']
const POWER_KEYS = ['plungerCurrent', 'pickUpCurrent', 'dropTipCurrent']
const TIP_KEYS = ['dropTipSpeed', 'pickUpDistance']

export default class ConfigForm extends React.Component<Props> {
  getFieldsByKey (
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

  render () {
    const {pipetteConfig, parentUrl} = this.props
    const {fields} = pipetteConfig
    const initialValues = mapValues(fields, f => {
      return f.value !== f.default ? f.value.toString() : null
    })
    const plungerFields = this.getFieldsByKey(PLUNGER_KEYS, fields)
    const powerFields = this.getFieldsByKey(POWER_KEYS, fields)
    const tipFields = this.getFieldsByKey(TIP_KEYS, fields)

    return (
      <Formik
        initialValues={initialValues}
        render={formProps => {
          const {values, handleChange, handleReset} = formProps
          return (
            <form>
              <FormColumn>
                <ConfigFormGroup
                  groupLabel="Plunger Positions"
                  values={values}
                  formFields={plungerFields}
                  onChange={handleChange}
                  error={null}
                />

                <ConfigFormGroup
                  groupLabel="Power / Force"
                  values={values}
                  formFields={powerFields}
                  onChange={handleChange}
                  error={null}
                />
              </FormColumn>
              <FormColumn>
                <ConfigFormGroup
                  groupLabel="Tip Pickup / Drop "
                  values={values}
                  formFields={tipFields}
                  onChange={handleChange}
                  error={null}
                />
              </FormColumn>
              <FormButtonBar
                buttons={[
                  {children: 'reset all', onClick: handleReset},
                  {children: 'cancel', Component: Link, to: parentUrl},
                  {children: 'save', type: 'submit'},
                ]}
              />
            </form>
          )
        }}
      />
    )
  }
}
