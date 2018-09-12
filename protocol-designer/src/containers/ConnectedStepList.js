// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import type {BaseState} from '../types'

import {selectors} from '../steplist'
import {StepList} from '../components/steplist'

type Props = React.ElementProps<typeof StepList>

function mapStateToProps (state: BaseState): Props {
  return {
    orderedSteps: selectors.orderedSteps(state),
  }
}

export default connect(mapStateToProps)(StepList)
