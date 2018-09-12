// @flow

import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'
import {actions, selectors, hintManifest} from '../../tutorial'
import type {HintKey} from '../../tutorial'
import {AlertItem} from '@opentrons/components'
import type {BaseState} from '../../types'

type SP = {hints: Array<HintKey>}
type DP = {removeHint: (HintKey) => mixed}
type Props = SP & DP

class Hints extends React.Component<Props> {
  makeHandleCloseClick = (hint) => () => this.props.removeHint(hint)

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
        ))}
      </div>
    )
  }
}

const mapStateToProps = (state: BaseState): SP => ({
  hints: selectors.getHints(state),
})
const mapDispatchToProps = (dispatch: Dispatch<*>): DP => ({
  removeHint: (hint) => dispatch(actions.removeHint(hint)),
})

export default connect(mapStateToProps, mapDispatchToProps)(Hints)
