// @flow
import { RobotCoordsForeignDiv } from '@opentrons/components'
import type { DeckSlot } from '@opentrons/shared-data'
import cx from 'classnames'
import * as React from 'react'

import type { LabwareOnDeck } from '../../../step-forms'
import { type TerminalItemId, START_TERMINAL_ITEM_ID } from '../../../steplist'
import { BlockedSlot } from './BlockedSlot'
import { BrowseLabware } from './BrowseLabware'
import { EditLabware } from './EditLabware'
import { LabwareHighlight } from './LabwareHighlight'
import { LabwareName } from './LabwareName'
import styles from './LabwareOverlays.css'

type LabwareControlsProps = {|
  labwareOnDeck: LabwareOnDeck,
  selectedTerminalItemId: ?TerminalItemId,
  slot: DeckSlot,
  setHoveredLabware: (?LabwareOnDeck) => mixed,
  setDraggedLabware: (?LabwareOnDeck) => mixed,
  swapBlocked: boolean,
|}

export const LabwareControls = (props: LabwareControlsProps): React.Node => {
  const {
    labwareOnDeck,
    slot,
    selectedTerminalItemId,
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
        <LabwareHighlight labwareOnDeck={labwareOnDeck} />
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
