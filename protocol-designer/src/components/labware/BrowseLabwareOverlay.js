// @flow
import React from 'react'
import cx from 'classnames'
import styles from './labware.css'

import ClickableText from './ClickableText'

type Props = {
  drillDown: () => mixed,
  drillUp: () => mixed,
}

function BrowseLabwareOverlay (props: Props) {
  return (
    <g className={cx(styles.slot_overlay, styles.appear_on_mouseover)}>
      <rect className={styles.overlay_panel} />
      <ClickableText
        onClick={props.drillDown}
        iconName='water' y='40%' text='View Liquids' />
    </g>
  )
}

export default BrowseLabwareOverlay
