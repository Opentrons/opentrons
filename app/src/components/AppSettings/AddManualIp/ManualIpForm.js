// @flow //
import * as React from 'react'
import { connect } from 'react-redux'
import { getConfig, addManualIp } from '../../../config'
import { startDiscovery } from '../../../discovery'

import { Formik, Form, Field } from 'formik'
import IpField from './IpField'

import type { State, Dispatch } from '../../../types'
import type { DiscoveryCandidates } from '../../../config'

type SP = {|
  candidates: DiscoveryCandidates,
|}

type DP = {|
  addManualIp: (ip: string) => mixed,
|}

type Props = { ...SP, ...DP }

class IpForm extends React.Component<Props> {
  inputRef: { current: null | HTMLInputElement }
  constructor(props) {
    super(props)
    this.inputRef = React.createRef()
  }
  render() {
    return (
      <Formik
        initialValues={{ ip: '' }}
        onSubmit={(values, actions) => {
          this.props.addManualIp(values.ip)

          const $input = this.inputRef.current
          if ($input) $input.blur()

          actions.resetForm()
        }}
        render={formProps => {
          return (
            <Form>
              <Field name="ip" component={IpField} inputRef={this.inputRef} />
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

function STP(state: State): SP {
  return {
    candidates: getConfig(state).discovery.candidates,
  }
}

function DTP(dispatch: Dispatch): DP {
  return {
    addManualIp: ip => {
      dispatch(addManualIp(ip))
      dispatch(startDiscovery())
    },
  }
}
