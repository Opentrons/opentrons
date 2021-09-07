import * as React from 'react'
import { connect } from 'react-redux'
import { getConfig, addManualIp } from '../../../../redux/config'
import { startDiscovery } from '../../../../redux/discovery'

import { Formik, Form, Field } from 'formik'
import { IpField } from './IpField'

import type { MapDispatchToProps } from 'react-redux'
import type { State } from '../../../../redux/types'
import type { DiscoveryCandidates } from '../../../../redux/config/types'

interface SP {
  candidates: DiscoveryCandidates
}

interface DP {
  addManualIp: (ip: string) => unknown
}

type Props = SP & DP

class ManualIpFormComponent extends React.Component<Props> {
  inputRef: { current: null | HTMLInputElement }

  constructor(props: Props) {
    super(props)
    this.inputRef = React.createRef()
  }

  render(): JSX.Element {
    return (
      <Formik
        initialValues={{ ip: '' }}
        onSubmit={(values, actions) => {
          // trim whitespace and carriage returns
          const ip = values.ip.trim()
          // guard against double submit on enter keypress
          if (!ip) return

          this.props.addManualIp(ip)

          const $input = this.inputRef.current
          if ($input) $input.blur()

          actions.resetForm()
        }}
      >
        <Form>
          <Field name="ip" component={IpField} inputRef={this.inputRef} />
        </Form>
      </Formik>
    )
  }
}

function mapStateToProps(state: State): SP {
  return {
    candidates: getConfig(state)?.discovery.candidates ?? [],
  }
}

const mapDispatchToProps: MapDispatchToProps<DP, {}> = dispatch => {
  return {
    addManualIp: ip => {
      dispatch(addManualIp(ip))
      dispatch(startDiscovery())
    },
  }
}

export const ManualIpForm = connect(
  mapStateToProps,
  mapDispatchToProps
)(ManualIpFormComponent)
