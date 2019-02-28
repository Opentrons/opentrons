// @flow
import * as React from 'react'
import {Formik} from 'formik'
import startCase from 'lodash/startCase'

import mapValues from 'lodash/mapValues'

import ConfigFormGroup, {FormColumn} from './ConfigFormGroup'

import type {Pipette} from '../../http-api-client'

// TODO (ka 2-19-2019):
// Move to settings.js when no longer mock data based

type FieldProps = {
  value: ?number,
  default: number,
  min?: number,
  max?: number,
  units?: string,
  type?: string,
}

export type DisplayFieldProps = FieldProps & {
  name: string,
  displayName: string,
}

type ConfigFields = {[string]: FieldProps}

type PipetteConfigOptions = {
  info: {
    name: ?string,
    model: ?string,
    id: ?string,
  },
  fields: ConfigFields,
}

type OP = {
  pipette: Pipette,
}

type SP = {
  options?: PipetteConfigOptions,
}

type Props = SP & OP

const PLUNGER_KEYS = ['top', 'bottom', 'blowout', 'dropTip']
const POWER_KEYS = ['plungerCurrent', 'pickUpCurrent', 'dropTipCurrent']
const TIP_KEYS = ['dropTipSpeed', 'pickUpDistance']

export default class ConfigForm extends React.Component<Props> {
  getFieldsByKey (
    keys: Array<string>,
    fields: ConfigFields
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
    const {fields} = OPTIONS
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
          const {values, handleChange} = formProps
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
            </form>
          )
        }}
      />
    )
  }
}

// GET /settings/pipettes/P50MV1318060102
const OPTIONS = {
  info: {
    name: 'p50_multi',
    model: 'p50_multi_v1.3',
  },
  fields: {
    top: {
      value: 19.5,
      min: 5,
      max: 19.5,
      units: 'mm',
      type: 'float',
      default: 19.5,
    },
    bottom: {
      value: 0,
      min: -2,
      max: 19,
      units: 'mm',
      type: 'float',
      default: 2,
    },
    blowout: {
      value: 0.5,
      min: -4,
      max: 10,
      units: 'mm',
      type: 'float',
      default: 0.5,
    },
    dropTip: {
      value: -5,
      min: -6,
      max: 2,
      units: 'mm',
      type: 'float',
      default: -5,
    },
    pickUpCurrent: {
      value: 0.6,
      min: 0.05,
      max: 1.2,
      units: 'A',
      type: 'float',
      default: 0.6,
    },
    pickUpDistance: {
      value: 10,
      min: 1,
      max: 30,
      units: 'mm',
      type: 'float',
      default: 10,
    },
    plungerCurrent: {
      value: 0.5,
      min: 0.1,
      max: 0.5,
      units: 'A',
      type: 'float',
      default: 0.5,
    },
    dropTipCurrent: {
      value: 0.5,
      min: 0.1,
      max: 0.8,
      units: 'A',
      type: 'float',
      default: 0.5,
    },
    dropTipSpeed: {
      value: 5,
      min: 0.001,
      max: 30,
      units: 'mm/sec',
      type: 'float',
      default: 5,
    },
    tipLength: {
      value: 51.7,
      units: 'mm',
      type: 'float',
      default: 51.7,
    },
    defaultAspirateFlowRate: {
      value: 25,
      min: 0.001,
      max: 100,
      default: 25,
    },
    defaultDispenseFlowRate: {
      value: 50,
      min: 0.001,
      max: 100,
      default: 50,
    },
  },
}
