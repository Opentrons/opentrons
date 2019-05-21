// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { LabwareNameOverlay, humanizeLabwareType } from '@opentrons/components'
import type { BaseState, ThunkDispatch } from '../../../types'
import { selectors as uiLabwareSelectors } from '../../../ui/labware'
import type { LabwareEntity } from '../../../step-forms'
type OP = {|
  labwareEntity: LabwareEntity,
|}

type SP = {|
  nickname: ?string,
|}

type Props = { ...OP, ...SP }

const NameOverlay = (props: Props) => {
  const { labwareEntity, nickname } = props
  const title =
    nickname ||
    labwareEntity.def.metadata.displayName ||
    humanizeLabwareType(labwareEntity.type)

  return <LabwareNameOverlay title={title} />
}

const mapStateToProps = (state: BaseState, ownProps: OP): SP => {
  const { id } = ownProps.labwareEntity
  return {
    nickname: uiLabwareSelectors.getLabwareNicknamesById(state)[id],
  }
}

export default connect<Props, OP, SP, _, BaseState, ThunkDispatch<*>>(
  mapStateToProps
)(NameOverlay)
