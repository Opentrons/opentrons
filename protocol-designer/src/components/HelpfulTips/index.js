// @flow

import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'
import {actions, selectors} from '../../tutorial'
import {AlertItem} from '@opentrons/components'
import type {BaseState} from '../../types'

type SP = {tips: Array<string>}

type DP = {
  onDismiss: (CommandCreatorWarning) => () => mixed
}

type Props = SP & DP

// These captions populate the AlertItem body, the title/message
// comes from the CommandCreatorError / CommandCreatorWarning
const captions: {[warningOrErrorType: string]: string} = {
  'INSUFFICIENT_TIPS': 'Add another tip rack to an empty slot in Deck Setup',
  'ASPIRATE_MORE_THAN_WELL_CONTENTS': 'You are trying to aspirate more than the current volume of one of your well(s). If you intended to add air to your tip, please use the Air Gap advanced setting.',
  'ASPIRATE_FROM_PRISTINE_WELL': "The well(s) you're trying to aspirate from are empty. You can add a starting liquid to this labware in the Labware & Liquids step"
}

const HelpfulTips = (props: Props) => {
  const warnings = props.tips.map((warning, key) => (
    <AlertItem
      type='warning'
      key={`warning:${key}`}
      title={warning.message}
      onCloseClick={props.onDismiss(warning)}
      >
        {captions[warning.type]}
      </AlertItem>
    ))

  return (
    <div>
      {warnings}
    </div>
  )
}

const mapStateToProps = (state: BaseState): SP => ({
  tips: selectors.getHelpfulTips(state)
})
const mapDispatchToProps = {
  dismissTip: actions.dismissTip
}

export default connect(mapStateToProps, mapDispatchToProps)(HelpfulTips)
