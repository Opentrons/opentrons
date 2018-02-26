// @flow
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'
import type {BaseState} from '../types'

import FilePage from '../components/FilePage'

import {actions, selectors} from '../file-data'
import type {FilePageFields, FieldConnector} from '../file-data'

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

  const fieldConnector: FieldConnector<FilePageFields> = (accessor) => {
    return {
      onChange: (e: SyntheticInputEvent<*>) =>
        dispatch(actions.updateFileField(accessor, e.currentTarget.value)),
      value: values[accessor]
    }
  }

  return {
    fieldConnector
  }
}
