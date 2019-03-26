// @flow //
import * as React from 'react'
import {connect} from 'react-redux'
import {getConfig, addManualIp} from '../../../config'

import {Formik, Form, Field} from 'formik'
import IpField from './IpField'

import type {State, Dispatch} from '../../../types'
import type {DiscoveryCandidates} from '../../../config'

type SP = {|
  candidates: DiscoveryCandidates,
|}

type DP = {|
  addManualIp: (ip: string) => mixed,
|}

type Props = {...SP, ...DP}

type FormValues = {[string]: ?string}

class IpForm extends React.Component<Props> {
  buttonRef: {current: null | HTMLButtonElement}
  inputRef: {current: null | HTMLInputElement}
  constructor (props) {
    super(props)
    this.buttonRef = React.createRef()
    this.inputRef = React.createRef()
  }
  validate = (values: FormValues) => {
    const errors = {}
    if (!values['ip']) {
      errors.ip = 'Empty Address'
    }
    return errors
  }
  render () {
    return (
      <Formik
        initialValues={{ip: ''}}
        validate={this.validate}
        onSubmit={(values, actions) => {
          this.props.addManualIp(values.ip)

          const $button = this.buttonRef.current
          if ($button) $button.blur()
          const $input = this.inputRef.current
          if ($input) $input.blur()

          actions.resetForm()
        }}
        render={formProps => {
          return (
            <Form>
              <Field
                name="ip"
                component={IpField}
                buttonRef={this.buttonRef}
                inputRef={this.inputRef}
              />
            </Form>
          )
        }}
      />
    )
  }
}

export default connect(
  STP,
  DTP
)(IpForm)

function STP (state: State): SP {
  return {
    candidates: getConfig(state).discovery.candidates,
  }
}

function DTP (dispatch: Dispatch): DP {
  return {
    addManualIp: ip => dispatch(addManualIp(ip)),
  }
}
