// @flow
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'
import {actions, selectors} from '../navigation'
import FileSidebar from '../components/FileSidebar'
import type {BaseState} from '../types'

type Props = React.ElementProps<typeof FileSidebar>

export default connect(mapStateToProps, null, mergeProps)(FileSidebar)

function mapStateToProps (state: BaseState): * {
  return {
    // Ignore clicking 'CREATE NEW' button in these cases
    _canCreateNew: !selectors.newProtocolModal(state)
  }
}

function mergeProps (stateProps: *, dispatchProps: {dispatch: Dispatch<*>}): Props {
  const {_canCreateNew} = stateProps
  const {dispatch} = dispatchProps
  return {
    onCreateNew: _canCreateNew
      ? () => dispatch(actions.toggleNewProtocolModal(true))
      : undefined
  }
}
