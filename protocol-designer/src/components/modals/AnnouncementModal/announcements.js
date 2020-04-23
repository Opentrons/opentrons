// @flow

import * as React from 'react'
import styles from './AnnouncementModal.css'

export type Announcement = {|
  announcementKey: string,
  image: React.Node | null,
  heading: string,
  message: React.Node,
|}

export const announcements: Array<Announcement> = [
  {
    announcementKey: 'modulesRequireRunAppUpdate',
    image: (
      <div className={styles.modules_diagrams_row}>
        <img
          className={styles.modules_diagram}
          src={require('../../../images/modules/magdeck_tempdeck_combined.png')}
        />
      </div>
    ),
    heading: "We've updated the Protocol Designer",
    message: (
      <>
        <p>
          Protocol Designer now includes Beta support for Temperature and
          Magnetic modules.
        </p>
        <p>
          Note: Protocols with modules{' '}
          <strong>may require an app and robot update to run</strong>. You will
          need to have the OT-2 app and robot on the latest versions (
          <strong>3.17 or higher</strong>).
        </p>
      </>
    ),
  },
]
