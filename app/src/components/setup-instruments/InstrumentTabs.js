// @flow
// instrument tabs bar container
// used for left/right pipette selection during pipette calibration

import {connect} from 'react-redux'
import {PageTabs, type PageTabProps} from '@opentrons/components'
import {selectors as robotSelectors, type Mount} from '../../robot'

export default connect(mapStateToProps)(PageTabs)

type OwnProps = {
  mount: Mount
}

function mapStateToProps (state, ownProps: OwnProps): PageTabProps {
  const pages = robotSelectors.getInstruments(state).map((inst) => ({
    title: inst.mount,
    href: `/setup-instruments/${inst.mount}`,
    isActive: inst.mount === ownProps.mount,
    isDisabled: !('name' in inst)
  }))

  return {pages}
}
