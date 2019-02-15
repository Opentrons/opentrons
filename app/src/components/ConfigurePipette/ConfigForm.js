// @flow
import * as React from 'react'
import {Formik} from 'formik'
import startCase from 'lodash/startCase'
import get from 'lodash/get'

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
    name: string,
    model: string,
  },
  fields: ConfigFields,
}

type OP = {
  pipette: ?Pipette,
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
    const plungerFields = getFieldsByKey(PLUNGER_KEYS, fields)
    console.log(plungerFields)
    return (
      <Formik
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

const PLUNGER_KEYS = ['top', 'bottom', 'blowOut', 'dropTip']

// TODO (ka 2019-2-14): Replace with API response
const OPTIONS = {
  info: {
    name: 'P50 Single',
    model: '1234567',
  },
  fields: {
    top: {
      value: null,
      default: 10,
      min: 1,
      max: 15,
      units: 'mm',
    },
    bottom: {
      value: null,
      default: 9,
      min: 1,
      max: 15,
      units: 'mm',
    },
    blowOut: {
      value: null,
      default: 8,
      min: 1,
      max: 15,
      units: 'mm',
    },
    dropTip: {
      value: null,
      default: 7,
      min: 1,
      max: 15,
      units: 'mm',
    },
  },
}
