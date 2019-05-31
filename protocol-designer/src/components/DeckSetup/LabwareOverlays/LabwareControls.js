// @flow
import React from 'react'
import cx from 'classnames'
import { connect } from 'react-redux'
import { RobotCoordsForeignDiv } from '@opentrons/components'
import type { DeckSlot } from '@opentrons/shared-data'

import { START_TERMINAL_ITEM_ID, type TerminalItemId } from '../../../steplist'
import type { LabwareOnDeck } from '../../../step-forms'
import { selectors as stepsSelectors } from '../../../ui/steps'
import styles from './LabwareOverlays.css'
import LabwareName from './LabwareName'
import EditLabware from './EditLabware'
import BrowseLabware from './BrowseLabware'

type OP = {|
  labwareOnDeck: LabwareOnDeck,
  selectedTerminalItemId: ?TerminalItemId,
  slot: DeckSlot,
|}

type SP = {|
  highlighted: boolean,
|}

type Props = {| ...OP, ...SP |}

const LabwareControls = (props: Props) => {
  const { labwareOnDeck, slot, selectedTerminalItemId, highlighted } = props
  const canEdit = selectedTerminalItemId === START_TERMINAL_ITEM_ID

  return (
    <RobotCoordsForeignDiv
      key={slot.id}
      x={slot.position[0]}
      y={slot.position[1]}
      width={slot.boundingBox.xDimension}
      height={slot.boundingBox.yDimension}
      innerDivProps={{
        className: cx(styles.slot_ui, {
          [styles.highlighted_border_div]: highlighted,
        }),
      }}
    >
      {canEdit ? (
        <EditLabware labwareOnDeck={labwareOnDeck} />
      ) : (
        <BrowseLabware labwareOnDeck={labwareOnDeck} />
      )}
      <LabwareName labwareOnDeck={labwareOnDeck} />
    </RobotCoordsForeignDiv>
  )
}

const mapStateToProps = (state: BaseState, ownProps: OP): SP => ({
  highlighted: stepsSelectors
    .getHoveredStepLabware(state)
    .includes(ownProps.labwareOnDeck.id),
})

export default connect<Props, OP, SP, _, _, _>(mapStateToProps)(LabwareControls)
