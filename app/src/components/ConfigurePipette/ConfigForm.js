// @flow
import * as React from 'react'
import {Formik} from 'formik'
import startCase from 'lodash/startCase'
import get from 'lodash/get'
import mapValues from 'lodash/mapValues'

import ConfigFormGroup, {FormColumn, ConfigInput} from './ConfigFormGroup'

import type {Pipette} from '../../http-api-client'

type FieldName = 'top' | 'bottom' | 'blowout' | 'droptip'

export type FieldProps = {
  value: ?number,
  default: number,
  min: number,
  max: number,
  units: string,
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
      // const _value =
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
                    return (
                      <ConfigInput
                        key={f.name}
                        name={f.name}
                        label={f.displayName}
                        units={f.units}
                        value={value}
                        placeholder={f.default}
                        min={f.min}
                        max={f.max}
                        onChange={handleChange}
                        error={null}
                      />
                    )
                  })}
                </ConfigFormGroup>
                <ConfigFormGroup groupLabel="Power / Force">
                  {powerFields.map(f => {
                    const value = this.getFieldValue(f.name, values)
                    return (
                      <ConfigInput
                        key={f.name}
                        name={f.name}
                        label={f.displayName}
                        units={f.units}
                        value={value}
                        placeholder={f.default}
                        min={f.min}
                        max={f.max}
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
                    return (
                      <ConfigInput
                        key={f.name}
                        name={f.name}
                        label={f.displayName}
                        units={f.units}
                        value={value}
                        placeholder={f.default}
                        min={f.min}
                        max={f.max}
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

function getFieldsByKey (keys: Array<string>, fields: any) {
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
      displayName: 'Top Plunger Position',
      default: 19.5,
    },
    bottom: {
      value: 0,
      min: -2,
      max: 19,
      units: 'mm',
      type: 'float',
      displayName: 'Bottom Plunger Position',
      default: 2,
    },
    blowout: {
      value: 0.5,
      min: -4,
      max: 10,
      units: 'mm',
      type: 'float',
      displayName: 'Blow Out Plunger Position',
      default: 0.5,
    },
    dropTip: {
      value: -5,
      min: -6,
      max: 2,
      units: 'mm',
      type: 'float',
      displayName: 'Drop Tip Plunger Position',
      default: -5,
    },
    pickUpCurrent: {
      value: 0.6,
      min: 0.05,
      max: 1.2,
      units: 'A',
      type: 'float',
      displayName: 'Pick Up Current',
      default: 0.6,
    },
    pickUpDistance: {
      value: 10,
      min: 1,
      max: 30,
      units: 'mm',
      type: 'float',
      displayName: 'Pick Up Distance',
      default: 10,
    },
    plungerCurrent: {
      value: 0.5,
      min: 0.1,
      max: 0.5,
      units: 'A',
      type: 'float',
      displayName: 'Plunger Current',
      default: 0.5,
    },
    dropTipCurrent: {
      value: 0.5,
      min: 0.1,
      max: 0.8,
      units: 'A',
      type: 'float',
      displayName: 'Drop Tip Current',
      default: 0.5,
    },
    dropTipSpeed: {
      value: 5,
      min: 0.001,
      max: 30,
      units: 'mm/sec',
      type: 'float',
      displayName: 'Drop Tip Speed',
      default: 5,
    },
    tipLength: {
      value: 51.7,
      units: 'mm',
      type: 'float',
      displayName: 'Tip Length',
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
