// @flow
import React from 'react'
import cx from 'classnames'
import { connect } from 'react-redux'
import { RobotCoordsForeignDiv } from '@opentrons/components'
import type { DeckSlot } from '@opentrons/shared-data'

import type { BaseState } from '../../../types'
import { START_TERMINAL_ITEM_ID, type TerminalItemId } from '../../../steplist'
import type { LabwareOnDeck } from '../../../step-forms'
import { selectors as stepsSelectors } from '../../../ui/steps'
import { BlockedSlot } from './BlockedSlot'
import BrowseLabware from './BrowseLabware'
import EditLabware from './EditLabware'
import LabwareName from './LabwareName'
import styles from './LabwareOverlays.css'

type OP = {|
  labwareOnDeck: LabwareOnDeck,
  selectedTerminalItemId: ?TerminalItemId,
  slot: DeckSlot,
  setHoveredLabware: (?LabwareOnDeck) => mixed,
  setDraggedLabware: (?LabwareOnDeck) => mixed,
  swapBlocked: boolean,
|}

type SP = {|
  highlighted: boolean,
|}

type Props = { ...OP, ...SP }

const LabwareControls = (props: Props) => {
  const {
    labwareOnDeck,
    slot,
    selectedTerminalItemId,
    highlighted,
    setHoveredLabware,
    setDraggedLabware,
    swapBlocked,
  } = props
  const canEdit = selectedTerminalItemId === START_TERMINAL_ITEM_ID
  const [x, y] = slot.position
  const width = labwareOnDeck.def.dimensions.xDimension
  const height = labwareOnDeck.def.dimensions.yDimension
  return (
    <>
      <RobotCoordsForeignDiv
        {...{ x, y, width, height }}
        innerDivProps={{
          className: cx(styles.labware_controls, {
            [styles.can_edit]: canEdit,
          }),
        }}
      >
        {highlighted && <div className={styles.highlighted_border_div} />}
        {canEdit ? (
          <EditLabware
            labwareOnDeck={labwareOnDeck}
            setHoveredLabware={setHoveredLabware}
            setDraggedLabware={setDraggedLabware}
            swapBlocked={swapBlocked}
          />
        ) : (
          <BrowseLabware labwareOnDeck={labwareOnDeck} />
        )}
        <LabwareName labwareOnDeck={labwareOnDeck} />
      </RobotCoordsForeignDiv>
      {swapBlocked && (
        <BlockedSlot
          {...{ x, y, width, height }}
          message="MODULE_INCOMPATIBLE_LABWARE_SWAP"
        />
      )}
    </>
  )
}

const mapStateToProps = (state: BaseState, ownProps: OP): SP => ({
  highlighted: stepsSelectors
    .getHoveredStepLabware(state)
    .includes(ownProps.labwareOnDeck.id),
})

export default connect<Props, OP, SP, {||}, _, _>(mapStateToProps)(
  LabwareControls
)
