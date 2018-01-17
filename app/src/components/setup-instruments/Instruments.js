import {connect} from 'react-redux'
import capitalize from 'lodash/capitalize'

import InstrumentGroup from './InstrumentGroup'

import {selectors as robotSelectors} from '../../robot'

export default connect(mapStateToProps, null, mergeProps)(InstrumentGroup)

function mapStateToProps (state, ownProps) {
  const instruments = robotSelectors.getInstruments(state)
  const currentInstrument = instruments.find((inst) => inst.axis === ownProps.mount)

  return {
    currentInstrument,
    instruments
  }
}

function mergeProps (stateProps) {
  const instruments = stateProps.instruments.map(inst => {
    const isUsed = inst.name != null
    const isDisabled = inst.axis !== stateProps.currentInstrument.axis
    const description = isUsed
      ? `${capitalize(inst.channels)}-channel (${inst.volume} ul)`
      : 'N/A'
    const tipType = isUsed
      ? `${inst.volume} ul`
      : 'N/A'

    return {
      ...inst,
      isDisabled,
      description,
      tipType
    }
  })

  return {
    ...stateProps,
    instruments
  }
}
