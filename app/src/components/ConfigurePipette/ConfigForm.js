// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {Link} from 'react-router-dom'
import {Formik} from 'formik'
import startCase from 'lodash/startCase'
import mapValues from 'lodash/mapValues'

import {makeGetRobotPipetteConfigs} from '../../http-api-client'
import {BottomButtonBar} from '../modals'
import ConfigFormGroup, {FormColumn} from './ConfigFormGroup'

import type {State} from '../../types'
import type {Robot} from '../../discovery'
import type {
  Pipette,
  Field,
  PipetteConfigResponse,
  PipetteConfigFields,
} from '../../http-api-client'

export type DisplayFieldProps = Field & {
  name: string,
  displayName: string,
}

type OP = {
  robot: Robot,
  pipette: Pipette,
  parentUrl: string,
}

type SP = {
  pipetteConfig: ?PipetteConfigResponse,
}

type Props = SP & OP

const PLUNGER_KEYS = ['top', 'bottom', 'blowout', 'dropTip']
const POWER_KEYS = ['plungerCurrent', 'pickUpCurrent', 'dropTipCurrent']
const TIP_KEYS = ['dropTipSpeed', 'pickUpDistance']

class ConfigForm extends React.Component<Props> {
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

    if (!pipetteConfig) {
      return null
    } else {
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
                <BottomButtonBar
                  buttons={[
                    {children: 'cancel', Component: Link, to: parentUrl},
                  ]}
                />
              </form>
            )
          }}
        />
      )
    }
  }
}

export default connect(
  makeMapStateToProps,
  null
)(ConfigForm)

function makeMapStateToProps (): (state: State, ownProps: OP) => SP {
  const getRobotPipetteConfigs = makeGetRobotPipetteConfigs()

  return (state, ownProps) => {
    const {
      robot,
      pipette: {id},
    } = ownProps
    const configCall = getRobotPipetteConfigs(state, robot)
    const configResponse = configCall.response
    const pipetteConfig = configResponse && configResponse[id]
    return {
      pipetteConfig: pipetteConfig,
    }
  }
}
