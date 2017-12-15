// instrument tabs bar container
// used for left/right pipette selection during pipette calibration

import {connect} from 'react-redux'
import {PageTabs} from '@opentrons/components'
import {selectors as robotSelectors} from '../../robot'

export default connect(mapStateToProps)(PageTabs)

function mapStateToProps (state, ownProps) {
  const pages = robotSelectors.getInstruments(state).map((inst) => ({
    title: inst.axis,
    href: `/setup-instruments/${inst.axis}`,
    isActive: inst.axis === ownProps.side,
    isDisabled: inst.name == null
  }))

  return {pages}
}
