// @flow
import * as React from 'react'
import {Link} from 'react-router-dom'
import {Formik} from 'formik'
import startCase from 'lodash/startCase'
import mapValues from 'lodash/mapValues'
import pick from 'lodash/pick'

import FormButtonBar from './FormButtonBar'
import ConfigFormGroup, {FormColumn} from './ConfigFormGroup'

import type {
  Pipette,
  PipetteSettingsField,
  PipetteConfigResponse,
  PipetteConfigFields,
  PipetteConfigRequest,
} from '../../http-api-client'

import type {FormValues} from './ConfigFormGroup'

export type DisplayFieldProps = PipetteSettingsField & {
  name: string,
  displayName: string,
}

type Props = {
  parentUrl: string,
  pipette: Pipette,
  pipetteConfig: PipetteConfigResponse,
  updateConfig: (id: string, PipetteConfigRequest) => mixed,
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

  getVisibleFields = () => {
    return pick(this.props.pipetteConfig.fields, [
      ...PLUNGER_KEYS,
      ...POWER_KEYS,
      ...TIP_KEYS,
    ])
  }

  handleSubmit = (values: FormValues) => {
    const params = mapValues(values, v => {
      let param
      if (!v) {
        param = null
      } else {
        param = {value: Number(v)}
      }
      return param
    })
    this.props.updateConfig(this.props.pipette.id, {fields: {...params}})
  }

  render () {
    const {parentUrl} = this.props
    const fields = this.getVisibleFields()
    const initialValues = mapValues(fields, f => {
      return f.value !== f.default ? f.value.toString() : null
    })
    const plungerFields = this.getFieldsByKey(PLUNGER_KEYS, fields)
    const powerFields = this.getFieldsByKey(POWER_KEYS, fields)
    const tipFields = this.getFieldsByKey(TIP_KEYS, fields)

    return (
      <Formik
        onSubmit={this.handleSubmit}
        initialValues={initialValues}
        render={formProps => {
          const {values, handleChange, handleReset, handleSubmit} = formProps
          return (
            <form onSubmit={handleSubmit}>
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
