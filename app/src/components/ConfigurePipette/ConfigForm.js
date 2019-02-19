// @flow
import * as React from 'react'
import {Formik} from 'formik'
import startCase from 'lodash/startCase'
import get from 'lodash/get'
import mapValues from 'lodash/mapValues'

import ConfigFormGroup, {FormColumn, ConfigInput} from './ConfigFormGroup'

import type {Pipette} from '../../http-api-client'

// TODO (ka 2-19-2019):
// defaultAspirateFlowRate, defaultDispenseFlowRate and tipLength
// do not have the same data shape as other fields
type FieldName =
  | 'top'
  | 'bottom'
  | 'blowout'
  | 'dropTip'
  | 'pickUpCurrent'
  | 'plungerCurrent'
  | 'dropTipCurrent'
  | 'dropTipSpeed'
  | 'pickUpDistance'
  | 'tipLength'
  | 'defaultAspirateFlowRate'
  | 'defaultDispenseFlowRate'

type FieldProps = {
  value: ?number,
  default: number,
  min?: number,
  max?: number,
  units?: string,
  type?: string,
}

type ConfigFields = {[FieldName]: FieldProps}

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

type FormValues = {[string]: ?(string | {[string]: string})}

export default class ConfigForm extends React.Component<Props> {
  getFieldValue (name: string, values: FormValues): ?string {
    return get(values, name)
  }

  render () {
    const {fields} = OPTIONS
    const initialValues = mapValues(fields, f => {
      return f.value !== f.default ? f.value.toString() : null
    })
    const plungerFields = getFieldsByKey(PLUNGER_KEYS, fields)
    const powerFields = getFieldsByKey(POWER_KEYS, fields)
    const tipFields = getFieldsByKey(TIP_KEYS, fields)
    console.log(plungerFields)
    return (
      <Formik
        initialValues={initialValues}
        render={formProps => {
          const {values, handleChange} = formProps
          return (
            <form>
              <FormColumn>
                <ConfigFormGroup groupLabel="Plunger Positions">
                  {plungerFields.map(f => {
                    const value = this.getFieldValue(f.name, values)
                    const _default = f.default.toString()
                    const {name, displayName, units, min, max} = f
                    return (
                      <ConfigInput
                        key={name}
                        name={name}
                        label={displayName}
                        units={units}
                        value={value}
                        placeholder={_default}
                        min={min}
                        max={max}
                        onChange={handleChange}
                        error={null}
                      />
                    )
                  })}
                </ConfigFormGroup>
                <ConfigFormGroup groupLabel="Power / Force">
                  {powerFields.map(f => {
                    const value = this.getFieldValue(f.name, values)
                    const _default = f.default.toString()
                    const {name, displayName, units, min, max} = f
                    return (
                      <ConfigInput
                        key={name}
                        name={name}
                        label={displayName}
                        units={units}
                        value={value}
                        placeholder={_default}
                        min={min}
                        max={max}
                        onChange={handleChange}
                        error={null}
                      />
                    )
                  })}
                </ConfigFormGroup>
              </FormColumn>
              <FormColumn>
                <ConfigFormGroup groupLabel="Tip Pickup / Drop ">
                  {tipFields.map(f => {
                    const value = this.getFieldValue(f.name, values)
                    const _default = f.default.toString()
                    const {name, displayName, units, min, max} = f
                    return (
                      <ConfigInput
                        key={name}
                        name={name}
                        label={displayName}
                        units={units}
                        value={value}
                        placeholder={_default}
                        min={min}
                        max={max}
                        onChange={handleChange}
                        error={null}
                      />
                    )
                  })}
                </ConfigFormGroup>
              </FormColumn>
            </form>
          )
        }}
      />
    )
  }
}

function getFieldsByKey (keys: Array<FieldName>, fields: ConfigFields) {
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

const PLUNGER_KEYS = ['top', 'bottom', 'blowout', 'dropTip']
const POWER_KEYS = ['plungerCurrent', 'pickUpCurrent', 'dropTipCurrent']
const TIP_KEYS = ['dropTipSpeed', 'pickUpDistance']

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
