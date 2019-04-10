// @flow
import React from 'react'
import cx from 'classnames'
import styles from './labware.css'

import ClickableText from './ClickableText'
import OverlayPanel from './OverlayPanel'

type Props = {
  drillDown: () => mixed,
  drillUp: () => mixed,
}

function BrowseLabwareOverlay(props: Props) {
  return (
    <g className={cx(styles.slot_overlay, styles.appear_on_mouseover)}>
      <OverlayPanel />
      <ClickableText
        onClick={props.drillDown}
        iconName="water"
        y="40%"
        text="View Liquids"
      />
    </g>
  )
}

export default BrowseLabwareOverlay
