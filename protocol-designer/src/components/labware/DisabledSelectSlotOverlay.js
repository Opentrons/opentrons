// @flow
import React from 'react'
import cx from 'classnames'
import {HandleKeypress} from '@opentrons/components'
import styles from './labware.css'

type DisabledSelectSlotOverlayProps = {
  cancelMove: () => mixed,
}

class DisabledSelectSlotOverlay extends React.Component<DisabledSelectSlotOverlayProps> {
  render () {
    return (
      <HandleKeypress preventDefault handlers={[{key: 'Escape', onPress: this.props.cancelMove}]}>
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
