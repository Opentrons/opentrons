// @flow
import * as React from 'react'
import { Icon } from '@opentrons/components'
import styles from './LiquidsPageInfo.css'

export function LiquidsPageInfo(): React.Node {
  return (
    <div className={styles.info_wrapper}>
      <h2 className={styles.header}>Define your liquids</h2>

      <div className={styles.instruction}>
        This is your inventory of the reagents and samples your protocol uses.
        Use the New Liquid button in the sidebar to start defining liquids.
      </div>

      <div className={styles.instruction}>
        {"After you've added your liquids, continue to the"}
        <Icon name="ot-design" className={styles.inline_icon} />
        tab where you can specify where labware and liquids start on your deck.
      </div>
    </div>
  )
}
