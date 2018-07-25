// @flow
import React from 'react'
import cx from 'classnames'
import {HandleKeypress, type DeckSlot} from '@opentrons/components'
import styles from './labware.css'

type DisabledSelectSlotOverlayProps = {setMoveLabwareMode: (slot: ?DeckSlot) => void}
class DisabledSelectSlotOverlay extends React.Component<DisabledSelectSlotOverlayProps> {
  cancelMove = () => {
    this.props.setMoveLabwareMode()
  }
  render () {
    return (
      <HandleKeypress preventDefault handlers={[{key: 'Escape', onPress: this.cancelMove}]}>
        <g className={cx(styles.slot_overlay, styles.disabled)}>
          <rect className={styles.overlay_panel} />
          <g className={styles.clickable_text}>
            <text x="0" y="40%">Select a slot</text>
          </g>
        </g>
      </HandleKeypress>
    )
  }
}

export default DisabledSelectSlotOverlay
