// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { LabwareNameOverlay } from '@opentrons/components'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import type { BaseState, ThunkDispatch } from '../../../types'
import { selectors as uiLabwareSelectors } from '../../../ui/labware'
import type { LabwareOnDeck } from '../../../step-forms'
type OP = {|
  labwareOnDeck: LabwareOnDeck,
|}

type SP = {|
  nickname: ?string,
|}

type Props = { ...OP, ...SP }

const NameOverlay = (props: Props) => {
  const { labwareOnDeck, nickname } = props
  const title = nickname || getLabwareDisplayName(labwareOnDeck.def)
  return <LabwareNameOverlay title={title} />
}

const mapStateToProps = (state: BaseState, ownProps: OP): SP => {
  const { id } = ownProps.labwareOnDeck
  return {
    nickname: uiLabwareSelectors.getLabwareNicknamesById(state)[id],
  }
}

export default connect<Props, OP, SP, _, BaseState, ThunkDispatch<*>>(
  mapStateToProps
)(NameOverlay)
