// @flow

import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'
import {actions, selectors} from '../../tutorial'
import {AlertItem} from '@opentrons/components'
import type {BaseState} from '../../types'
import hintManifest from './hintManifest'

type SP = {hints: Array<string>}

type DP = {dismissHint: (CommandCreatorWarning) => () => mixed}

type Props = SP & DP

class Hints extends React.Component<Props> {
  makeHandleCloseClick = (hint) => () => this.props.dismissHint(hint)

  render () {
    return (
      <div>
        {this.props.hints.map((hint) => (
          <AlertItem
            type='warning'
            key={`hint:${hint}`}
            title={hintManifest[hint].title}
            onCloseClick={this.makeHandleCloseClick(hint)}>
              {hintManifest[hint].body}
            </AlertItem>
          ))
        }
      </div>
    )
  }
}

const mapStateToProps = (state: BaseState): SP => ({
  hints: selectors.getHints(state)
})
const mapDispatchToProps = (dispatch: Dispatch): DP => ({
  dismissHint: (hint) => dispatch(actions.dismissHint(hint))
})

export default connect(mapStateToProps, mapDispatchToProps)(Hints)
