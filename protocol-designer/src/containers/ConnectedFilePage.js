// @flow
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'
import type {BaseState} from '../types'

import FilePage from '../components/FilePage'

import {actions, selectors} from '../file-data'
import type {FilePageFields} from '../file-data'
import {formConnectorFactory, type FormConnector} from '../utils'
export default connect(mapStateToProps, null, mergeProps)(FilePage)

function mapStateToProps (state: BaseState): FilePageFields {
  return selectors.fileFormValues(state)
}

function mergeProps (
  stateProps: FilePageFields,
  dispatchProps: {dispatch: Dispatch<*>}
): React.ElementProps<typeof FilePage> {
  const values = stateProps
  const {dispatch} = dispatchProps

  const onChange = (accessor) => (e: SyntheticInputEvent<*>) => {
    if (accessor === 'name' || accessor === 'description' || accessor === 'author') {
      dispatch(actions.updateFileFields({
        [accessor]: e.target.value
      }))
    } else {
      console.warn('Invalid accessor in ConnectedFilePage:', accessor)
    }
  }

  const formConnector: FormConnector<FilePageFields> = formConnectorFactory(onChange, values)

  return {
    formConnector
  }
}
