import * as React from 'react'
import { connect } from 'react-redux'
import { getConfig, addManualIp } from '../../redux/config'
import { startDiscovery } from '../../redux/discovery'
import { Formik, Form, Field } from 'formik'
import { IpHostnameField } from './IpHostnameField'

import type { MapDispatchToProps } from 'react-redux'
import type { State } from '../../redux/types'
import type { DiscoveryCandidates } from '../../redux/config/types'

interface SP {
  candidates: DiscoveryCandidates
}

interface DP {
  addManualIp: (ip: string) => unknown
}

type Props = SP & DP

export function ManualIpHostnameFormComponent(props: Props): JSX.Element {
  const inputRef = React.useRef<HTMLInputElement>(null)

  return (
    <Formik
      initialValues={{ ip: '' }}
      onSubmit={(values, actions) => {
        const ip = values.ip.trim()
        if (!ip) return
        props.addManualIp(ip)
        const $input = inputRef.current
        if ($input) $input.blur()
        actions.resetForm()
      }}
    >
      <Form>
        <Field name="ip" component={IpHostnameField} />
      </Form>
    </Formik>
  )
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

export const ManualIpHostnameForm = connect(
  mapStateToProps,
  mapDispatchToProps
)(ManualIpHostnameFormComponent)
