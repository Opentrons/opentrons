// @flow
import {connect} from 'react-redux'
import capitalize from 'lodash/capitalize'

import type InstrumentInfoProps from './InstrumentInfo'
import InstrumentGroup from './InstrumentGroup'

import {
  constants as robotConstants,
  selectors as robotSelectors
} from '../../robot'

type OwnProps = {
  mount: ?string
}

type StateProps = {
  instruments: InstrumentInfoProps[]
}

export default connect(mapStateToProps)(InstrumentGroup)

function mapStateToProps (state, ownProps: OwnProps): StateProps {
  const currentMount = ownProps.mount
  const allInstruments = robotSelectors.getInstruments(state)

  const instruments = robotConstants.INSTRUMENT_MOUNTS.map((mount) => {
    const inst = allInstruments.find((i) => i.mount === mount)
    const isDisabled = !inst || mount !== currentMount

    const description = inst
      ? `${capitalize(`${inst.channels}`)}-channel (${inst.volume} ul)`
      : 'N/A'

    const tipType = inst
      ? `${inst.volume} ul`
      : 'N/A'

    return {
      ...(inst || {mount}),
      isDisabled,
      description,
      tipType
    }
  })

  return {instruments}
}
