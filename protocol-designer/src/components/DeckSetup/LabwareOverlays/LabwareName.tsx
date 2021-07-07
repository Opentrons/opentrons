import * as React from 'react'
import { connect } from 'react-redux'
import { LabwareNameOverlay } from '@opentrons/components'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import { BaseState } from '../../../types'
import { selectors as uiLabwareSelectors } from '../../../ui/labware'
import { LabwareOnDeck } from '../../../step-forms'
interface OP {
  labwareOnDeck: LabwareOnDeck
}

interface SP {
  nickname?: string | null
}

type Props = OP & SP

const NameOverlay = (props: Props): JSX.Element => {
  const { labwareOnDeck, nickname } = props
  const title = nickname || getLabwareDisplayName(labwareOnDeck.def)
  // TODO(mc, 2019-06-27): µL to uL replacement needed to handle CSS capitalization
  return <LabwareNameOverlay title={title.replace('µL', 'uL')} />
}

const mapStateToProps = (state: BaseState, ownProps: OP): SP => {
  const { id } = ownProps.labwareOnDeck
  return {
    nickname: uiLabwareSelectors.getLabwareNicknamesById(state)[id],
  }
}

export const LabwareName = connect(mapStateToProps)(NameOverlay)
