// @flow
// instrument tabs bar container
// used for left/right pipette selection during pipette calibration

import {connect} from 'react-redux'
import {PageTabs, type PageTabProps} from '@opentrons/components'
import {
  constants as robotConstants,
  selectors as robotSelectors,
  type Mount
} from '../../robot'

export default connect(mapStateToProps)(PageTabs)

type OwnProps = {
  mount: Mount
}

function mapStateToProps (state, ownProps: OwnProps): PageTabProps {
  const instruments = robotSelectors.getInstruments(state)

  const pages = robotConstants.INSTRUMENT_MOUNTS.map((mount) => ({
    title: mount,
    href: `/setup-instruments/${mount}`,
    isActive: mount === ownProps.mount,
    isDisabled: !instruments.some((inst) => inst.mount === mount)
  }))

  return {pages}
}
